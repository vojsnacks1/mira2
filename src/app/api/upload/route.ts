import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { generateEmbeddings, formatVectorForPg } from "@/lib/embeddings";
import { PDFParse } from "pdf-parse";

function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  let start = 0;
  const cleaned = text.replace(/\s+/g, " ").trim();
  while (start < cleaned.length) {
    const end = Math.min(start + chunkSize, cleaned.length);
    chunks.push(cleaned.slice(start, end));
    if (end === cleaned.length) break;
    start += chunkSize - overlap;
  }
  return chunks;
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File;
  const conversationId = formData.get("conversationId") as string | null;

  if (!file) return new Response("No file provided", { status: 400 });

  let text = "";
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  if (file.name.endsWith(".pdf")) {
    const parser = new PDFParse({ data: new Uint8Array(bytes) });
    const result = await parser.getText();
    text = result.text;
    await parser.destroy();
  } else {
    text = buffer.toString("utf-8");
  }

  if (!text.trim()) return new Response("Could not extract text", { status: 400 });

  const chunks = chunkText(text, 500, 100);
  const embeddings = await generateEmbeddings(chunks);

  for (let i = 0; i < chunks.length; i++) {
    const id = crypto.randomUUID();
    const embeddingStr = formatVectorForPg(embeddings[i]);
    await prisma.$executeRawUnsafe(
      `INSERT INTO "DocumentChunk" (id, "userId", "conversationId", filename, "chunkIndex", content, embedding, "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7::vector, NOW())`,
      id,
      userId,
      conversationId ?? null,
      file.name,
      i,
      chunks[i],
      embeddingStr,
    );
  }

  return Response.json({ success: true, chunks: chunks.length, filename: file.name });
}

export async function DELETE(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { conversationId } = await req.json();
  if (!conversationId) return new Response("conversationId is required", { status: 400 });

  await prisma.$executeRawUnsafe(
    `DELETE FROM "DocumentChunk" WHERE "userId" = $1 AND "conversationId" = $2`,
    userId,
    conversationId,
  );

  return Response.json({ success: true });
}
