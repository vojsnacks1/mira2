import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, generateText, tool, stepCountIs } from "ai";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { searchRelevantChunks } from "@/lib/search";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

const searchWeb = tool({
  description:
    "Search the web for current information, news, facts, or anything that requires up-to-date knowledge.",
  inputSchema: z.object({
    query: z.string().describe("The search query"),
  }),
  execute: async ({ query }) => {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query,
        max_results: 5,
        search_depth: "basic",
      }),
    });
    if (!res.ok) throw new Error(`Tavily error: ${res.status}`);
    const data = await res.json();
    return (data.results as { title: string; url: string; content: string }[])
      .map((r) => `**${r.title}**\n${r.url}\n${r.content}`)
      .join("\n\n");
  },
});

// After each reply, update the user's memory with any new facts.
// This runs in the background — it doesn't block the streaming response.
async function updateMemory(
  userId: string,
  existingMemory: string | null,
  newMessages: { role: string; content: string }[],
) {
  try {
    const prompt = existingMemory
      ? `You maintain a personal fact file about a user. Update it based on their latest conversation.

Rules:
- Only store concrete, specific facts: name, age, job, location, hobbies, preferences, relationships, goals, health, etc.
- Do NOT store observations about conversation behavior (e.g. "the user wants to share more", "the user is curious").
- Do NOT store anything vague or meta. Only real facts about who they are and what they like/do/want.
- If nothing new was learned, return the current memory unchanged.
- Keep it concise — bullet points or short sentences.

Current memory:
${existingMemory}

New conversation:
${newMessages.map((m) => `${m.role}: ${m.content}`).join("\n")}

Return the updated fact file only. No commentary.`
      : `You are building a personal fact file about a user from their conversation.

Rules:
- Only store concrete, specific facts: name, age, job, location, hobbies, preferences, relationships, goals, health, etc.
- Do NOT store observations about conversation behavior (e.g. "the user wants to share more", "the user is curious").
- Do NOT store anything vague or meta. Only real facts about who they are and what they like/do/want.
- If nothing personal was shared, return an empty string — nothing else.

Conversation:
${newMessages.map((m) => `${m.role}: ${m.content}`).join("\n")}

Return the fact file only. No commentary.`;

    const { text } = await generateText({
      model: google("gemini-2.5-flash"),
      prompt,
    });

    const trimmed = text.trim();
    if (!trimmed) return;

    await prisma.userMemory.upsert({
      where: { userId },
      create: { userId, content: trimmed },
      update: { content: trimmed },
    });
  } catch (err) {
    // Memory update is best-effort — don't crash the chat if it fails
    console.error("[memory] update failed:", err);
  }
}

async function generateTitle(conversationId: string, firstMessage: string) {
  try {
    const { text } = await generateText({
      model: google("gemini-2.5-flash"),
      prompt: `Generate a short title (3-6 words, no quotes) for a conversation that starts with: "${firstMessage}"`,
    });
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { title: text.trim() },
    });
  } catch (err) {
    console.error("[title] generation failed:", err);
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      console.error("[chat] auth failed — no userId");
      return new Response("Unauthorized", { status: 401 });
    }

    const { messages, conversationId } = await req.json();

    if (!conversationId) {
      return new Response("conversationId is required", { status: 400 });
    }

    // Ensure the conversation exists, creating it if necessary
    await prisma.conversation.upsert({
      where: { id: conversationId },
      create: { id: conversationId, userId },
      update: { updatedAt: new Date() },
    });

    // Load what Marcus already knows about this user
    const memory = await prisma.userMemory.findUnique({ where: { userId } });

    // Search for relevant document chunks (only if user has uploads)
    const relevantChunks = await searchRelevantChunks(
      messages[messages.length - 1].content,
      userId,
      conversationId ?? null,
    ).catch(() => []);

    const docsContext =
      relevantChunks.length > 0
        ? `\n\nRelevant context from uploaded documents:\n${relevantChunks
            .map((c) => `[From ${c.filename}]: ${c.content}`)
            .join("\n\n")}`
        : "";

    const systemPrompt = [
      "You are Marcus Aurelius, the Roman emperor and Stoic philosopher. You speak with calm wisdom, drawing from Stoic philosophy and your Meditations. You are direct, thoughtful, and compassionate — never preachy. You help the user reflect on their situation with clarity. Use first-person naturally. Occasionally reference Stoic ideas (impermanence, virtue, reason, the present moment) but only when relevant — don't force it. Speak in modern English, not archaic Latin. Be concise.",
      memory?.content
        ? `\nHere's what you know about the user from past conversations:\n${memory.content}\n\nUse this to personalize your responses naturally — don't recite it back, just let it inform how you talk to them.`
        : "",
      docsContext,
    ]
      .join("")
      .trim();

    // Save the user's message
    await prisma.message.create({
      data: {
        userId,
        conversationId,
        role: "user",
        content: messages[messages.length - 1].content,
      },
    });

    // Auto-generate a title from the first message of a new conversation
    if (messages.length === 1) {
      generateTitle(conversationId, messages[0].content).catch(() => {});
    }

    const result = streamText({
      model: google("gemini-2.5-flash"),
      system: systemPrompt,
      messages,
      tools: { searchWeb },
      stopWhen: stepCountIs(5),
      onFinish: async ({ text }) => {
        // Save the assistant reply
        await prisma.message.create({
          data: { userId, conversationId, role: "assistant", content: text },
        });

        // Await memory update — must complete before the serverless function exits
        await updateMemory(userId, memory?.content ?? null, [
          ...messages,
          { role: "assistant", content: text },
        ]);
      },
    });

    return result.toTextStreamResponse();
  } catch (err) {
    console.error("[chat] error:", err);
    return new Response(
      err instanceof Error ? err.message : "Internal server error",
      { status: 500 },
    );
  }
}
