"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getOrphanedEmails() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  return prisma.emailThread.findMany({
    where: { campaign_id: null },
    orderBy: { received_at: 'desc' }
  });
}

export async function assignEmailToCampaign(emailId: string, campaignId: string, reviewId?: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  const email = await prisma.emailThread.findUnique({
    where: { id: emailId }
  });

  if (!email) throw new Error("Email not found");

  // Extract ticket ID if present
  const ticketMatch = email.subject?.match(/\[(?:Ticket ID:\s*)?([0-9]-[0-9]+)\]/i);
  const googleTicketId = ticketMatch ? ticketMatch[1] : null;

  return await prisma.$transaction(async (tx) => {
    // 1. Link email to campaign
    const updatedEmail = await tx.emailThread.update({
      where: { id: emailId },
      data: { campaign_id: campaignId }
    });

    // 2. If a specific review was provided, link it to the removal request
    let removalRequestId: string | null = null;
    
    if (googleTicketId) {
      // Find or create removal request for this ticket
      const existingReq = await tx.removalRequest.findFirst({
        where: { google_reference_id: googleTicketId }
      });

      if (existingReq) {
        removalRequestId = existingReq.id;
      } else if (reviewId) {
        const newReq = await tx.removalRequest.create({
          data: {
            campaign_id: campaignId,
            submitted_by_user_id: session.user.id,
            submission_type: 'API',
            submitted_at: new Date(),
            google_reference_id: googleTicketId,
            notes: "Manually assigned from Orphaned Inbox",
            removal_request_reviews: {
              create: { review_id: reviewId }
            }
          }
        });
        removalRequestId = newReq.id;
      }
    }

    // 3. Log Audit
    await tx.auditLog.create({
      data: {
        user_id: session.user.id,
        action: "EMAIL_ASSIGNED",
        entity_type: "EMAIL_THREAD",
        entity_id: emailId,
        metadata: JSON.stringify({ campaignId, reviewId, googleTicketId })
      }
    });

    return { success: true };
  });

  revalidatePath("/dashboard/admin/inbox");
}

export async function deleteEmailThread(id: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  await prisma.emailThread.delete({
    where: { id }
  });

  revalidatePath("/dashboard/admin/inbox");
  return { success: true };
}
