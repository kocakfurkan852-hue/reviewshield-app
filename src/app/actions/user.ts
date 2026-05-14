"use server"

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function createUser(data: { name: string, email: string, role: "AGENT" | "ADMIN", permissions?: string[] }) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Only admins can create users");
  }

  const password = "password123";
  const password_hash = bcrypt.hashSync(password, 10);

  await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password_hash: password_hash,
      role: data.role,
      permissions: data.permissions || ["view_dashboard", "manage_reviews"]
    }
  });

  revalidatePath("/dashboard/admin/users");
  return { success: true };
}

export async function updateUser(id: string, data: { name?: string, email?: string, role?: "AGENT" | "ADMIN", permissions?: string[], password?: string }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...otherData } = data;
  const updateData: any = { ...otherData };
  
  if (password && password.trim().length >= 6) {
    updateData.password_hash = bcrypt.hashSync(password, 10);
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: updateData
  });

  revalidatePath("/dashboard/admin/users");
  return { success: true };
}


export async function deleteUser(id: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  // Prevent deleting yourself
  if (session.user.id === id) throw new Error("You cannot delete yourself");

  await prisma.user.delete({ where: { id } });

  revalidatePath("/dashboard/admin/users");
  return { success: true };
}

export async function getUsers() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      permissions: true,
      created_at: true,
    },
    orderBy: { created_at: 'desc' }
  });

  return JSON.parse(JSON.stringify(users));
}

