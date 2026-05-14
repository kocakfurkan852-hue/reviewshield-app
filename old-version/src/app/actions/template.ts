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
