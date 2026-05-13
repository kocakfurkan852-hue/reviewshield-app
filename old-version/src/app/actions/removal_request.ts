"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function createRemovalRequest(campaignId: string, reviewIds: string[], googleReferenceId?: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  // Get system settings for reminders
  const intervalSetting = await prisma.systemSetting.findUnique({ where: { setting_key: 'default_reminder_interval_days' } });
  const maxCountSetting = await prisma.systemSetting.findUnique({ where: { setting_key: 'default_reminder_max_count' } });
  
  const intervalDays = parseInt(intervalSetting?.setting_value || "14");
  const maxCount = parseInt(maxCountSetting?.setting_value || "3");

  const removalRequest = await prisma.$transaction(async (tx) => {
    // 1. Create Removal Request
    const request = await tx.removalRequest.create({
      data: {
        campaign_id: campaignId,
        submitted_by_user_id: session.user.id,
        submission_type: "FORM",
        submitted_at: new Date(),
        google_reference_id: googleReferenceId || null,
        removal_request_reviews: {
          create: reviewIds.map(id => ({ review_id: id }))
        }
      }
    });

    // 2. Update Reviews Status to SUBMITTED
    await tx.review.updateMany({
      where: { id: { in: reviewIds } },
      data: { status: "SUBMITTED", submitted_at: new Date() }
    });

    // 3. Auto-create Reminder Schedule
    const nextReminder = new Date();
    nextReminder.setDate(nextReminder.getDate() + intervalDays);

    await tx.reminderSchedule.create({
      data: {
        removal_request_id: request.id,
        reminder_interval_days: intervalDays,
        reminder_max_count: maxCount,
        next_reminder_due_at: nextReminder,
      }
    });

    // 4. Audit Log
    await tx.auditLog.create({
      data: {
        user_id: session.user.id,
        action: "REMOVAL_REQUEST_CREATED",
        entity_type: "REMOVAL_REQUEST",
        entity_id: request.id,
        metadata: JSON.stringify({ review_count: reviewIds.length, googleReferenceId })
      }
    });

    return request;
  });

  revalidatePath(`/dashboard/admin/campaigns/${campaignId}`);
  return { success: true, id: removalRequest.id };
}
