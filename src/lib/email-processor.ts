import { prisma } from "@/lib/prisma";
import { parseGoogleResponse } from "@/lib/claude";
import { generateDraft } from "@/lib/draft";

export async function processEmail({
  subject,
  bodyData,
  messageId,
  threadId
}: {
  subject: string;
  bodyData: string;
  messageId: string;
  threadId: string;
}) {
  // Check for existing message to avoid duplicates
  const existing = await prisma.emailThread.findFirst({
    where: { gmail_message_id: messageId }
  });

  if (existing) {
    return { 
      success: true, 
      already_processed: true, 
      emailThreadId: existing.id,
      campaignId: existing.campaign_id 
    };
  }

  // Extract ticket ID from subject. Google tickets are typically like [0-1234000000000] or [Ticket ID: 1-12345]
  const ticketMatch = subject?.match(/\[(?:Ticket ID:\s*)?([0-9]-[0-9]+)\]/i);
  const googleTicketId = ticketMatch ? ticketMatch[1] : null;

  let campaignId: string | null = null;
  let removalRequestId: string | null = null;

  // Try to find a ReviewShieldRef in the body (hidden tracking code)
  const refMatch = bodyData?.match(/ReviewShieldRef:\s*([a-f0-9\-]{36})/i);
  const reviewIdFromRef = refMatch ? refMatch[1] : null;

  if (reviewIdFromRef) {
    const review = await prisma.review.findUnique({
      where: { id: reviewIdFromRef },
      select: { campaign_id: true }
    });
    if (review) {
      campaignId = review.campaign_id;
      
      // Check if a removal request already exists for this review with this ticket ID
      const existingReq = await prisma.removalRequestReview.findFirst({
        where: { review_id: reviewIdFromRef },
        include: { removal_request: true }
      });

      if (existingReq) {
        removalRequestId = existingReq.removal_request_id;
        // Update ticket ID if we just discovered it (e.g. from the auto-reply)
        if (googleTicketId && !existingReq.removal_request.google_reference_id) {
          await prisma.removalRequest.update({
            where: { id: removalRequestId },
            data: { google_reference_id: googleTicketId }
          });
        }
      } else {
        // Create a new Removal Request since we received an email but had no request tracked
        // This handles the auto-reply ingestion beautifully
        const newReq = await prisma.removalRequest.create({
          data: {
            campaign_id: campaignId,
            submitted_by_user_id: (await prisma.user.findFirst({ where: { role: 'ADMIN' } }))!.id, // fallback admin
            submission_type: 'API',
            submitted_at: new Date(),
            google_reference_id: googleTicketId,
            notes: "Auto-created from Zapier ingestion",
            removal_request_reviews: {
              create: { review_id: reviewIdFromRef }
            }
          }
        });
        removalRequestId = newReq.id;
      }
    }
  }

  // If no Ref found, try matching by Ticket ID directly
  if (!campaignId && googleTicketId) {
    const request = await prisma.removalRequest.findFirst({
      where: { google_reference_id: googleTicketId },
      select: { id: true, campaign_id: true }
    });
    if (request) {
      campaignId = request.campaign_id;
      removalRequestId = request.id;
    }
  }

  // Fallback 1: Try matching business name in subject or body
  if (!campaignId) {
    const clients = await prisma.client.findMany({ select: { id: true, company_name: true }});
    for (const client of clients) {
      // Very basic text match (case insensitive)
      const nameLower = client.company_name.toLowerCase();
      if (subject.toLowerCase().includes(nameLower) || bodyData.toLowerCase().includes(nameLower)) {
         const campaign = await prisma.campaign.findFirst({ where: { client_id: client.id, status: "ACTIVE" }});
         if (campaign) {
            campaignId = campaign.id;
            break;
         }
      }
    }
  }

  // Fallback 2: Pick the first active campaign ONLY if we are absolutely desperate, 
  // but this is dangerous, so we'll just return an error to avoid dumping unrelated emails into Client 1.
  if (!campaignId) {
    return { success: false, reason: "No campaign or tracking ref associated with this email." };
  }

  if (campaignId && threadId) {
    // Parse with AI
    const aiAnalysis = await parseGoogleResponse(bodyData, subject || "");
    const parsedAction = aiAnalysis.parsedAction as "APPROVED" | "REJECTED" | "NEEDS_INFO" | "UNKNOWN";

    // Create EmailThread record
    const emailThread = await prisma.emailThread.create({
      data: {
        campaign_id: campaignId,
        gmail_thread_id: threadId,
        gmail_message_id: messageId,
        subject: subject || "Unknown Subject",
        received_at: new Date(),
        direction: "INBOUND",
        raw_body: bodyData,
        ai_summary: aiAnalysis.summary,
        ai_parsed_action: parsedAction,
        ai_confidence: aiAnalysis.confidence,
        google_response_type: aiAnalysis.googleResponseType,
        processed: true
      }
    });

    // === KEY FIX: Update Review status based on AI classification ===
    if (removalRequestId && parsedAction !== "UNKNOWN") {
      // Find all reviews linked to this removal request
      const linkedReviews = await prisma.removalRequestReview.findMany({
        where: { removal_request_id: removalRequestId },
        select: { review_id: true }
      });

      const reviewIds = linkedReviews.map(lr => lr.review_id);

      if (reviewIds.length > 0) {
        const statusMap: Record<string, string> = {
          "APPROVED": "APPROVED",
          "REJECTED": "REJECTED",
          "NEEDS_INFO": "NEEDS_INFO"
        };

        const newStatus = statusMap[parsedAction];
        if (newStatus) {
          await prisma.review.updateMany({
            where: { id: { in: reviewIds } },
            data: {
              status: newStatus as any,
              resolved_at: (parsedAction === "APPROVED" || parsedAction === "REJECTED") ? new Date() : undefined
            }
          });
        }
      }

      // Mark reminder as stale if APPROVED (no more follow-ups needed)
      if (parsedAction === "APPROVED") {
        await prisma.reminderSchedule.updateMany({
          where: { removal_request_id: removalRequestId },
          data: { stale: true, reminder_enabled: false }
        });
      }
    }

    // === Auto-generate draft replies for REJECTED/NEEDS_INFO ===
    if (removalRequestId && (parsedAction === "REJECTED" || parsedAction === "NEEDS_INFO")) {
      const scenarioKey = parsedAction === "REJECTED" ? "REJECTION_RESPONSE" : "NEEDS_INFO_RESPONSE";

      // Get campaign client info for placeholders
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        include: { client: true }
      });

      try {
        await generateDraft({
          campaign_id: campaignId,
          removal_request_id: removalRequestId,
          email_thread_id: emailThread.id,
          scenario_key: scenarioKey,
          language: "DE",
          to_address: "removals@google.com",
          draft_type: "REPLY",
          placeholders: {
            client_name: campaign?.client.company_name || "Unknown",
            google_ticket_id: googleTicketId || "Unknown",
          }
        });
      } catch (draftError) {
        // Don't fail the whole email processing if template is missing
        console.warn(`Could not auto-generate ${scenarioKey} draft:`, draftError);
      }
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: "EMAIL_PROCESSED",
        entity_type: "EMAIL_THREAD",
        entity_id: emailThread.id,
        metadata: JSON.stringify({
          ai_parsed_action: parsedAction,
          ai_confidence: aiAnalysis.confidence,
          campaign_id: campaignId,
          removal_request_id: removalRequestId,
          reviews_updated: removalRequestId ? true : false
        })
      }
    });

    return {
      success: true,
      campaignId,
      emailThreadId: emailThread.id,
      ai_parsed_action: parsedAction,
      ai_summary: aiAnalysis.summary,
      ai_confidence: aiAnalysis.confidence
    };
  }

  return { success: false, reason: "No campaign associated" };
}
