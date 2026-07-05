import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { embedMany, embed } from "ai";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

const embeddingModel = google.textEmbeddingModel("text-embedding-004");

export async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: embeddingModel,
    value: text,
  });
  return embedding;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: texts,
  });
  return embeddings;
}

export function formatVectorForPg(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}
