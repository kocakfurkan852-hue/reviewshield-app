import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// GET /api/external/status
// Health-check endpoint for monitoring ReviewShield system state
export async function GET(req: Request) {
  const apiKey = req.headers.get("x-api-key");

  if (!apiKey || apiKey !== process.env.EXTERNAL_API_KEY) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid or missing API Key" },
      { status: 401 }
    );
  }

  try {
    const [
      activeCampaigns,
      pendingReviews,
      submittedReviews,
      approvedReviews,
      totalEmails,
      unprocessedEmails,
      pendingDrafts,
      dueReminders,
      settings,
    ] = await Promise.all([
      prisma.campaign.count({ where: { status: "ACTIVE" } }),
      prisma.review.count({ where: { status: "PENDING" } }),
      prisma.review.count({ where: { status: "SUBMITTED" } }),
      prisma.review.count({ where: { status: "APPROVED" } }),
      prisma.emailThread.count(),
      prisma.emailThread.count({ where: { processed: false } }),
      prisma.outboundDraft.count({ where: { status: "PENDING_REVIEW" } }),
      prisma.reminderSchedule.count({
        where: {
          reminder_enabled: true,
          stale: false,
          next_reminder_due_at: { lte: new Date() },
        },
      }),
      prisma.systemSetting.findMany(),
    ]);

    const getSetting = (key: string) =>
      settings.find((s) => s.setting_key === key)?.setting_value || null;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      system: {
        email_scanning: {
          enabled: getSetting("EMAIL_SCAN_ENABLED") === "true",
          frequency: getSetting("EMAIL_SCAN_FREQUENCY"),
          last_scan: getSetting("LAST_SCAN_TIME")
            ? new Date(
                parseInt(getSetting("LAST_SCAN_TIME")!, 10)
              ).toISOString()
            : null,
        },
        approval_gate: getSetting("approval_gate_enabled") === "true",
      },
      metrics: {
        active_campaigns: activeCampaigns,
        reviews: {
          pending: pendingReviews,
          submitted: submittedReviews,
          approved: approvedReviews,
        },
        emails: {
          total: totalEmails,
          unprocessed: unprocessedEmails,
        },
        pending_drafts: pendingDrafts,
        due_reminders: dueReminders,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Status Endpoint Error:", error);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
