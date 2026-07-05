import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MemoryEditor from "./MemoryEditor";

export default async function MemoryPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const memory = await prisma.userMemory.findUnique({ where: { userId } });

  return <MemoryEditor initialContent={memory?.content ?? ""} />;
}
