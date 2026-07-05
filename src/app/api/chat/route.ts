import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      console.error("[chat] auth failed — no userId");
      return new Response("Unauthorized", { status: 401 });
    }

    const { messages } = await req.json();
    console.log("[chat] userId:", userId, "messages:", messages.length);

    await prisma.message.create({
      data: {
        userId,
        role: "user",
        content: messages[messages.length - 1].content,
      },
    });

    const result = streamText({
      model: google("gemini-2.5-flash"),
      system:
        "You are Mira, a warm and helpful personal AI assistant. Be concise, friendly, and direct.",
      messages,
      onFinish: async ({ text }) => {
        await prisma.message.create({
          data: { userId, role: "assistant", content: text },
        });
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
