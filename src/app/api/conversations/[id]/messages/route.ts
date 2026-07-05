import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;

  const messages = await prisma.message.findMany({
    where: { conversationId: id, userId },
    orderBy: { createdAt: "asc" },
    select: { id: true, role: true, content: true },
  });

  return Response.json(messages);
}
