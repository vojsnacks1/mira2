"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function saveMemory(
  content: string,
): Promise<{ success: true } | { error: string }> {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  await prisma.userMemory.upsert({
    where: { userId },
    update: { content },
    create: { userId, content },
  });

  return { success: true };
}

export async function clearMemory(): Promise<
  { success: true } | { error: string }
> {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  await prisma.userMemory.deleteMany({ where: { userId } });

  return { success: true };
}
