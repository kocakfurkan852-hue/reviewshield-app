"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendEmail } from "@/lib/gmail";

export async function getPendingDrafts() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  return prisma.outboundDraft.findMany({
    where: { status: 'PENDING_REVIEW' },
    include: {
      campaign: {
        include: { client: true }
      },
      email_thread: true
    },
    orderBy: { created_at: 'asc' }
  });
}

export async function approveAndSendDraft(draftId: string, finalSubject: string, finalBody: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Only admins can approve drafts");
  }

  const draft = await prisma.outboundDraft.findUnique({
    where: { id: draftId },
    include: {
      email_thread: true
    }
  });
  if (!draft) throw new Error("Draft not found");

  // Update draft to APPROVED state, updating the subject and body to final versions
  await prisma.outboundDraft.update({
    where: { id: draftId },
    data: {
      status: 'APPROVED',
      reviewed_by_user_id: session.user.id,
      reviewed_at: new Date(),
      rendered_subject: finalSubject,
      rendered_body: finalBody,
    }
  });

  // Log the approval
  await prisma.auditLog.create({
    data: {
      user_id: session.user.id,
      action: "DRAFT_APPROVED",
      entity_type: "OUTBOUND_DRAFT",
      entity_id: draftId,
    }
  });

  // Send the email via Gmail API
  const sendResult = await sendEmail({
    to: draft.to_address,
    subject: finalSubject,
    body: finalBody,
    threadId: draft.email_thread?.gmail_thread_id || undefined,
    inReplyTo: draft.email_thread?.gmail_message_id || undefined,
  });

  if (sendResult.success) {
    // Mark draft as SENT
    await prisma.outboundDraft.update({
      where: { id: draftId },
      data: {
        status: 'SENT',
        sent_at: new Date()
      }
    });

    // Create OUTBOUND EmailThread record for timeline tracking
    await prisma.emailThread.create({
      data: {
        campaign_id: draft.campaign_id,
        gmail_thread_id: draft.email_thread?.gmail_thread_id || sendResult.messageId || "outbound",
        gmail_message_id: sendResult.messageId || "outbound",
        subject: finalSubject,
        received_at: new Date(),
        direction: "OUTBOUND",
        raw_body: finalBody,
        ai_summary: `Sent by ${session.user.name}: ${finalSubject}`,
        processed: true
      }
    });

    // Audit log for successful send
    await prisma.auditLog.create({
      data: {
        user_id: session.user.id,
        action: "EMAIL_SENT",
        entity_type: "OUTBOUND_DRAFT",
        entity_id: draftId,
        metadata: JSON.stringify({ gmail_message_id: sendResult.messageId })
      }
    });
  } else {
    // Send failed — keep draft as APPROVED (not SENT) so it can be retried
    console.error(`Failed to send draft ${draftId}:`, sendResult.error);
    
    await prisma.auditLog.create({
      data: {
        user_id: session.user.id,
        action: "EMAIL_SEND_FAILED",
        entity_type: "OUTBOUND_DRAFT",
        entity_id: draftId,
        metadata: JSON.stringify({ error: sendResult.error })
      }
    });
  }

  revalidatePath("/dashboard/admin/approval-queue");
  return { success: true, sent: sendResult.success, error: sendResult.error };
}

export async function rejectDraft(draftId: string, adminNote: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  await prisma.outboundDraft.update({
    where: { id: draftId },
    data: {
      status: 'REJECTED',
      reviewed_by_user_id: session.user.id,
      reviewed_at: new Date(),
      admin_note: adminNote
    }
  });

  await prisma.auditLog.create({
    data: {
      user_id: session.user.id,
      action: "DRAFT_REJECTED",
      entity_type: "OUTBOUND_DRAFT",
      entity_id: draftId,
      metadata: JSON.stringify({ reason: adminNote })
    }
  });

  revalidatePath("/dashboard/admin/approval-queue");
  return { success: true };
}

