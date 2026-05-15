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

export async function updateCampaign(id: string, data: { name?: string, status?: any, agent_ids?: string[] }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) throw new Error("Campaign not found");

  const updateData: any = {};
  if (data.name) updateData.name = data.name;
  if (data.status) updateData.status = data.status;

  if (data.agent_ids) {
    // Delete old assignments and create new ones
    updateData.assignments = {
      deleteMany: {},
      create: data.agent_ids.map(uid => ({ user_id: uid }))
    };
  }

  await prisma.campaign.update({
    where: { id },
    data: updateData
  });

  revalidatePath(`/dashboard/admin/clients/${campaign.client_id}`);
  revalidatePath("/dashboard/admin/clients");
  return { success: true };
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

export async function getCampaignEmails(campaignId: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  const emails = await prisma.emailThread.findMany({
    where: { campaign_id: campaignId },
    orderBy: { received_at: 'desc' },
    select: {
      id: true,
      subject: true,
      direction: true,
      ai_parsed_action: true,
      ai_summary: true,
      ai_confidence: true,
      google_response_type: true,
      processed: true,
      received_at: true,
      raw_body: true,
      gmail_thread_id: true,
    }
  });

  return JSON.parse(JSON.stringify(emails));
}

export async function getTransferableCampaigns(currentCampaignId: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  const campaigns = await prisma.campaign.findMany({
    where: { 
      id: { not: currentCampaignId },
      status: 'ACTIVE'
    },
    select: {
      id: true,
      name: true,
      client: {
        select: { company_name: true }
      }
    },
    orderBy: { created_at: 'desc' }
  });

  return JSON.parse(JSON.stringify(campaigns));
}
