import { createGoogleGenerativeAI } from "@ai-sdk/google";
import {
  streamText,
  toTextStream,
  createTextStreamResponse,
  type ModelMessage,
} from "ai";
import { auth } from "@clerk/nextjs/server";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages } = await req.json();

  // Convert UIMessage[] (parts-based) to ModelMessage[] (content-based)
  const modelMessages: ModelMessage[] = (messages as Array<{
    role: string;
    parts?: Array<{ type: string; text?: string }>;
    content?: string;
  }>)
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content:
        m.parts?.find((p) => p.type === "text")?.text ?? m.content ?? "",
    }));

  const result = streamText({
    model: google("gemini-2.0-flash"),
    system:
      "You are Mira, a warm and helpful personal AI assistant. Be concise, friendly, and direct.",
    messages: modelMessages,
  });

  return createTextStreamResponse({
    stream: toTextStream({ stream: result.fullStream }),
  });
}
