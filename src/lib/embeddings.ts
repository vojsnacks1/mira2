import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { embedMany, embed } from "ai";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

// text-embedding-004 was retired by Google on Jan 14, 2026.
// gemini-embedding-001 is the replacement — output dimension is flexible,
// so we request 768 to match the `vector(768)` column in the DB schema.
const embeddingModel = google.textEmbeddingModel("gemini-embedding-001");
const embeddingOptions = {
  providerOptions: {
    google: { outputDimensionality: 768 },
  },
};

export async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: embeddingModel,
    value: text,
    ...embeddingOptions,
  });
  return embedding;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: texts,
    ...embeddingOptions,
  });
  return embeddings;
}

export function formatVectorForPg(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}
