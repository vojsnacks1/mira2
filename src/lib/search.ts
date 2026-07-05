import { prisma } from "@/lib/prisma";
import { generateEmbedding, formatVectorForPg } from "@/lib/embeddings";

export async function searchRelevantChunks(
  query: string,
  userId: string,
  conversationId: string | null,
  topK = 5,
): Promise<{ content: string; filename: string; similarity: number }[]> {
  // Skip expensive embedding call if user has no documents at all
  const docCount = await prisma.documentChunk.count({ where: { userId } });
  if (docCount === 0) return [];

  const embedding = await generateEmbedding(query);
  const embeddingStr = formatVectorForPg(embedding);

  const results = await prisma.$queryRawUnsafe<
    { content: string; filename: string; similarity: number }[]
  >(
    `SELECT content, filename, 1 - (embedding <=> $1::vector) as similarity
     FROM "DocumentChunk"
     WHERE "userId" = $2
     ${conversationId ? `AND ("conversationId" = $3 OR "conversationId" IS NULL)` : ""}
     ORDER BY embedding <=> $1::vector
     LIMIT ${topK}`,
    embeddingStr,
    userId,
    ...(conversationId ? [conversationId] : []),
  );

  return results.filter((r) => r.similarity > 0.5);
}
