import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateDraft } from "@/lib/draft";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.EXTERNAL_API_KEY}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    // Find due reminders
    const dueReminders = await prisma.reminderSchedule.findMany({
      where: {
        reminder_enabled: true,
        stale: false,
        next_reminder_due_at: { lte: now }
      },
      include: {
        removal_request: {
          include: {
            campaign: { include: { client: true } },
            outbound_drafts: { orderBy: { created_at: 'desc' }, take: 1 } // To get the last thread context
          }
        }
      }
    });

    let processedCount = 0;

    for (const schedule of dueReminders) {
      if (schedule.reminder_count >= schedule.reminder_max_count) {
        // Mark as stale if we've hit the max
        await prisma.reminderSchedule.update({
          where: { id: schedule.id },
          data: { stale: true }
        });
        continue;
      }

      const request = schedule.removal_request;
      const lastDraft = request.outbound_drafts[0];

      // Determine which template scenario to use
      let scenarioKey = "FOLLOW_UP_1";
      if (schedule.reminder_count > 0) {
        scenarioKey = schedule.reminder_count === schedule.reminder_max_count - 1 ? "FOLLOW_UP_FINAL" : "FOLLOW_UP_1";
      }

      // Generate the draft
      await generateDraft({
        campaign_id: request.campaign_id,
        removal_request_id: request.id,
        email_thread_id: lastDraft?.email_thread_id || undefined,
        scenario_key: scenarioKey,
        language: "DE", // Hardcoding DE for now, in a real app this might be inferred
        to_address: lastDraft?.to_address || "removals@google.com",
        draft_type: "REMINDER",
        placeholders: {
          client_name: request.campaign.client.company_name,
          google_ticket_id: request.google_reference_id || "Unknown",
        }
      });

      // Update schedule
      const nextDue = new Date();
      nextDue.setDate(nextDue.getDate() + schedule.reminder_interval_days);

      await prisma.reminderSchedule.update({
        where: { id: schedule.id },
        data: {
          reminder_count: schedule.reminder_count + 1,
          last_reminder_sent_at: new Date(),
          next_reminder_due_at: nextDue
        }
      });

      processedCount++;
    }

    return NextResponse.json({ 
      success: true, 
      message: `Processed ${processedCount} reminder schedules.`
    });

  } catch (error: unknown) {
    const err = error as Error;
    console.error("Reminder Cron Error:", error);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
