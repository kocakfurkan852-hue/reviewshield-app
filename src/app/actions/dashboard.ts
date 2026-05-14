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
    submittedReviews,
    pendingDrafts,
    totalEmails,
    unprocessedEmails,
    dueReminders,
    recentLogs,
    settings
  ] = await Promise.all([
    prisma.client.count(),
    prisma.campaign.count({ where: { status: 'ACTIVE' } }),
    prisma.review.count({ where: { status: 'PENDING' } }),
    prisma.review.count({ where: { status: 'APPROVED' } }),
    prisma.review.count({ where: { status: 'SUBMITTED' } }),
    prisma.outboundDraft.count({ where: { status: 'PENDING_REVIEW' } }),
    prisma.emailThread.count(),
    prisma.emailThread.count({ where: { processed: false } }),
    prisma.reminderSchedule.count({
      where: {
        reminder_enabled: true,
        stale: false,
        next_reminder_due_at: { lte: new Date() }
      }
    }),
    prisma.auditLog.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      include: { user: { select: { name: true } } }
    }),
    prisma.systemSetting.findMany()
  ]);

  const lastScanSetting = settings.find(s => s.setting_key === 'LAST_SCAN_TIME');
  const lastScanTime = lastScanSetting
    ? new Date(parseInt(lastScanSetting.setting_value, 10)).toISOString()
    : null;

  return {
    totalClients,
    activeCampaigns,
    pendingReviews,
    approvedReviews,
    submittedReviews,
    pendingDrafts,
    totalEmails,
    unprocessedEmails,
    dueReminders,
    lastScanTime,
    recentLogs
  };
}

