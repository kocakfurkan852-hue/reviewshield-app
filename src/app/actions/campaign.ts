"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function createCampaign(data: { client_id: string, name: string, agent_ids: string[] }) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Only admins can create campaigns");
  }
  
  const campaign = await prisma.campaign.create({
    data: {
      client_id: data.client_id,
      name: data.name,
      assignments: {
        create: data.agent_ids.map(id => ({ user_id: id }))
      }
    }
  });
  
  revalidatePath(`/dashboard/admin/clients/${data.client_id}`);
  revalidatePath("/dashboard/admin/clients");
  return { success: true, id: campaign.id };
}

export async function deleteCampaign(id: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) throw new Error("Campaign not found");

  await prisma.campaign.delete({ where: { id } });

  revalidatePath(`/dashboard/admin/clients/${campaign.client_id}`);
  revalidatePath("/dashboard/admin/clients");
  return { success: true };
}

export async function getClientCampaigns(client_id: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  const campaigns = await prisma.campaign.findMany({
    where: { client_id },
    include: {
      assignments: {
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      },
      _count: {
        select: { reviews: true, removal_requests: true }
      }
    },
    orderBy: { created_at: 'desc' }
  });

  return JSON.parse(JSON.stringify(campaigns));
}

export async function getAgents() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  const agents = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: 'asc' }
  });
  return JSON.parse(JSON.stringify(agents));
}
