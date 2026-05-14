"use server"

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createUser(data: { name: string, email: string, role: "AGENT" | "ADMIN" }) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Only admins can create users");
  }

  // Hardcoded password for now since there's no email flow.
  // In a real app, you'd send an invite email or generate a random password.
  const password = "password123";

  await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password_hash: "password123",
      role: data.role,
    }
  });

  revalidatePath("/dashboard/admin/users");
  return { success: true };
}

export async function getUsers() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  const users = await prisma.user.findMany({
    orderBy: { created_at: 'desc' }
  });

  return JSON.parse(JSON.stringify(users));
}
