"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function createTemplate(data: {
  name: string;
  scenario_key: string;
  subject_line: string;
  body_text: string;
  language: "DE" | "EN";
  is_default: boolean;
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Only admins can manage templates");
  }

  // If this is set as default for a scenario, unset others
  if (data.is_default) {
    await prisma.responseTemplate.updateMany({
      where: { scenario_key: data.scenario_key, language: data.language, is_default: true },
      data: { is_default: false }
    });
  }

  const template = await prisma.responseTemplate.create({
    data: {
      ...data,
      version: 1,
      active: true
    }
  });

  revalidatePath("/dashboard/admin/templates");
  return { success: true, id: template.id };
}

export async function getTemplates() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  return prisma.responseTemplate.findMany({
    orderBy: [
      { scenario_key: 'asc' },
      { language: 'asc' },
      { created_at: 'desc' }
    ]
  });
}

export async function updateTemplate(id: string, data: {
  name?: string;
  scenario_key?: string;
  subject_line?: string;
  body_text?: string;
  language?: "DE" | "EN";
  is_default?: boolean;
  active?: boolean;
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  if (data.is_default && data.scenario_key && data.language) {
    await prisma.responseTemplate.updateMany({
      where: { scenario_key: data.scenario_key, language: data.language, is_default: true, id: { not: id } },
      data: { is_default: false }
    });
  }

  // Increment version on body or subject change
  const existing = await prisma.responseTemplate.findUnique({ where: { id } });
  let version = existing?.version || 1;
  if (data.body_text && data.body_text !== existing?.body_text) version += 1;
  else if (data.subject_line && data.subject_line !== existing?.subject_line) version += 1;

  await prisma.responseTemplate.update({
    where: { id },
    data: { ...data, version }
  });

  revalidatePath("/dashboard/admin/templates");
  return { success: true };
}

export async function deleteTemplate(id: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  await prisma.responseTemplate.delete({ where: { id } });

  revalidatePath("/dashboard/admin/templates");
  return { success: true };
}
