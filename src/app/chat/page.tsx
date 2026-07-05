import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import ChatUI from "./ChatUI";

export default async function ChatPage() {
  const { userId } = await auth();

  const history = userId
    ? await prisma.message.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
      })
    : [];

  return (
    <ChatUI
      initialMessages={history.map((m) => ({
        role: m.role,
        content: m.content,
      }))}
    />
  );
}
