"use server"

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getAdminDashboardStats() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  const [
    totalClients,
    activeCampaigns,
    pendingReviews,
    approvedReviews,
    pendingDrafts,
    recentLogs
  ] = await Promise.all([
    prisma.client.count(),
    prisma.campaign.count({ where: { status: 'ACTIVE' } }),
    prisma.review.count({ where: { status: 'PENDING' } }),
    prisma.review.count({ where: { status: 'APPROVED' } }),
    prisma.outboundDraft.count({ where: { status: 'PENDING_REVIEW' } }),
    prisma.auditLog.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      include: { user: { select: { name: true } } }
    })
  ]);

  return {
    totalClients,
    activeCampaigns,
    pendingReviews,
    approvedReviews,
    pendingDrafts,
    recentLogs
  };
}
