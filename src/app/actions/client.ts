"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function createClient(data: { company_name: string, contact_name: string, contact_email: string, phone?: string, notes?: string }) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Only admins can create clients");
  }
  
  const client = await prisma.client.create({
    data: {
      company_name: data.company_name,
      contact_name: data.contact_name,
      contact_email: data.contact_email,
      phone: data.phone || null,
      notes: data.notes || null,
      created_by_user_id: session.user.id
    }
  });
  
  revalidatePath("/dashboard/admin/clients");
  return { success: true, id: client.id };
}

export async function getClients() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    throw new Error("Unauthorized");
  }

  // Assuming admins can see all clients. 
  // If agents should only see their assigned clients, we would filter here based on campaign assignments.
  const clients = await prisma.client.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      _count: {
        select: { campaigns: true }
      }
    }
  });

  return JSON.parse(JSON.stringify(clients));
}

export async function getClientById(id: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  const client = await prisma.client.findUnique({
    where: { id }
  });

  if (!client) throw new Error("Client not found");
  return JSON.parse(JSON.stringify(client));
}

export async function deleteClient(id: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  await prisma.client.delete({
    where: { id }
  });

  revalidatePath("/dashboard/admin/clients");
  return { success: true };
}

export async function getClientsWithCampaigns() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  const data = await prisma.client.findMany({
    where: { deleted_at: null },
    include: {
      campaigns: {
        where: { status: 'ACTIVE' },
        include: {
          reviews: {
            where: { deleted_at: null },
            select: { id: true, reviewer_name: true, star_rating: true }
          }
        }
      }
    },
    orderBy: { company_name: 'asc' }
  });

  return JSON.parse(JSON.stringify(data));
}

