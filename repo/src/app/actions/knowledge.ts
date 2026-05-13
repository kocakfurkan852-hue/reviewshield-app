"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function createKnowledgeEntry(data: {
  title: string;
  category: "LEGAL_TEMPLATE" | "DELETION_PROCESS" | "GOOGLE_TOS" | "CASE_LAW" | "CUSTOM";
  content: string;
  source: string;
  tags: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Only admins can manage the knowledge base");
  }

  const tagArray = data.tags.split(',').map(t => t.trim()).filter(Boolean);

  const entry = await prisma.knowledgeBase.create({
    data: {
      title: data.title,
      category: data.category,
      content: data.content,
      source: data.source,
      tags: tagArray,
      priority: 1,
      active: true
    }
  });

  revalidatePath("/dashboard/admin/knowledge");
  return { success: true, id: entry.id };
}

export async function getKnowledgeEntries() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  return prisma.knowledgeBase.findMany({
    orderBy: { created_at: 'desc' }
  });
}
