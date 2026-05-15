import { prisma } from "@/lib/prisma";
import { parseGoogleResponse, generateEmailResponse } from "@/lib/claude";

/**
 * Core email processing pipeline.
 * 
 * Flow:
 * 1. Deduplicate by gmail_message_id
 * 2. Match email → campaign via ReviewShieldRef, Ticket ID, or business name
 * 3. Classify email using AI + KnowledgeBase rules
 * 4. Update review status based on classification
 * 5. Generate templated draft reply if ACTION_REQUIRED
 * 6. Auto-learn: log unknown patterns for future KB growth
 */
export async function processEmail({
  subject,
  bodyData,
  messageId,
  threadId,
  forcedCampaignId
}: {
  subject: string;
  bodyData: string;
  messageId: string;
  threadId: string;
  forcedCampaignId?: string;
}) {
  // ── Step 1: Deduplication ──
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

  // ── Step 2: Match to Campaign ──
  const ticketMatch = subject?.match(/\[(?:Ticket ID:\s*)?([0-9]-[0-9]+)\]/i);
  const googleTicketId = ticketMatch ? ticketMatch[1] : null;

  let campaignId: string | null = forcedCampaignId || null;
  let removalRequestId: string | null = null;

  // 2a: Try ReviewShieldRef in body
  const refMatch = bodyData?.match(/ReviewShieldRef:\s*([a-f0-9\-]{36})/i);
  const reviewIdFromRef = refMatch ? refMatch[1] : null;

  if (reviewIdFromRef) {
    const review = await prisma.review.findUnique({
      where: { id: reviewIdFromRef },
      select: { campaign_id: true }
    });
    if (review) {
      campaignId = review.campaign_id;
      
      const existingReq = await prisma.removalRequestReview.findFirst({
        where: { review_id: reviewIdFromRef },
        include: { removal_request: true }
      });

      if (existingReq) {
        removalRequestId = existingReq.removal_request_id;
        if (googleTicketId && !existingReq.removal_request.google_reference_id) {
          await prisma.removalRequest.update({
            where: { id: removalRequestId },
            data: { google_reference_id: googleTicketId }
          });
        }
      } else {
        const newReq = await prisma.removalRequest.create({
          data: {
            campaign_id: campaignId,
            submitted_by_user_id: (await prisma.user.findFirst({ where: { role: 'ADMIN' } }))!.id,
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

  // 2b: Try Ticket ID match
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

  // 2c: Try business name fuzzy match
  if (!campaignId) {
    const clients = await prisma.client.findMany({ select: { id: true, company_name: true }});
    for (const client of clients) {
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

  // ── Step 2d: No match → Allow Orphan (Never reject, store for manual assignment)
  // Removed rejection block to allow orphaned emails.

  // ── Step 3: AI Classification (powered by KnowledgeBase) ──
  const aiAnalysis = await parseGoogleResponse(bodyData, subject || "");
  const parsedAction = aiAnalysis.parsedAction as "APPROVED" | "REJECTED" | "NEEDS_INFO" | "UNKNOWN";
  const responseCode = aiAnalysis.responseCode || "UNKNOWN";

  // ── Step 4: Create EmailThread record (campaignId can be null) ──
  const emailThread = await prisma.emailThread.create({
    data: {
      campaign_id: campaignId || null,
      gmail_thread_id: threadId,
      gmail_message_id: messageId,
      subject: subject || "Unknown Subject",
      received_at: new Date(),
      direction: "INBOUND",
      raw_body: bodyData,
      ai_summary: aiAnalysis.summary,
      ai_parsed_action: parsedAction,
      ai_confidence: aiAnalysis.confidence,
      google_response_type: responseCode,
      processed: true
    }
  });

  // ── Step 5: Update Review Status (Only if campaign matched) ──
  if (campaignId && removalRequestId && parsedAction !== "UNKNOWN") {
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

    // Disable reminders on SUCCESS
    if (parsedAction === "APPROVED") {
      await prisma.reminderSchedule.updateMany({
        where: { removal_request_id: removalRequestId },
        data: { stale: true, reminder_enabled: false }
      });
    }
  }

  // ── Step 6: Generate Draft Reply (Only if campaign matched) ──
  if (campaignId && removalRequestId && parsedAction === "NEEDS_INFO" && responseCode !== "UNKNOWN") {
    // Load campaign + client context for placeholder filling
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        client: true,
        reviews: {
          select: { review_url: true },
          take: 10
        }
      }
    });

    try {
      const companyName = campaign?.client.company_name || "Unknown";
      const authorizedName = campaign?.client.deletion_name || campaign?.client.contact_name || "Unknown";
      const reviewUrls = campaign?.reviews.map(r => r.review_url) || [];

      const draftResult = await generateEmailResponse(
        bodyData,
        responseCode,
        companyName,
        googleTicketId || "Unknown",
        {
          authorizedName,
          reviewUrls,
          googlePlaceUrl: campaign?.client.google_maps_url || undefined,
        }
      );

      await prisma.outboundDraft.create({
        data: {
          campaign_id: campaignId,
          email_thread_id: emailThread.id,
          removal_request_id: removalRequestId,
          draft_type: "REPLY",
          rendered_subject: draftResult.subject,
          rendered_body: draftResult.body,
          to_address: "removals@google.com",
          status: "PENDING_REVIEW"
        }
      });
    } catch (draftError) {
      console.warn(`Could not generate ${responseCode} draft:`, draftError);
    }
  }

    // ── Step 7: Auto-Learn Unknown Patterns ──
    if (responseCode === "UNKNOWN" && aiAnalysis.confidence < 70) {
      // Log the unknown pattern for future KB growth
      try {
        await prisma.knowledgeBase.create({
          data: {
            category: "CUSTOM",
            title: `[AUTO] Unknown Email Pattern — ${new Date().toISOString().split('T')[0]}`,
            content: `## Unclassified Email (Auto-Captured)

**Subject:** ${subject?.substring(0, 200)}
**Key Phrases:** ${bodyData.substring(0, 500)}
**AI Confidence:** ${aiAnalysis.confidence}%
**AI Summary:** ${aiAnalysis.summary}

### Admin Action Required
1. Review this email content
2. Determine the correct classification (RQ1-RQ6, SUCCESS, DECLINED)
3. Add new trigger phrases to the "Email Classification Rules (Master)" KB entry
4. Optionally create a new ResponseTemplate if this is a genuinely new response type
5. Delete this auto-captured entry once processed`,
            source: "auto-captured",
            tags: ["auto-learn", "unknown", "needs-review", "unclassified"],
            priority: 1,
            active: true,
          }
        });
      } catch (kbError) {
        console.warn("Could not auto-log unknown pattern to KB:", kbError);
      }
    }

    // ── Step 8: Audit Log ──
    await prisma.auditLog.create({
      data: {
        action: "EMAIL_PROCESSED",
        entity_type: "EMAIL_THREAD",
        entity_id: emailThread.id,
        metadata: JSON.stringify({
          ai_parsed_action: parsedAction,
          response_code: responseCode,
          ai_confidence: aiAnalysis.confidence,
          campaign_id: campaignId,
          removal_request_id: removalRequestId,
          reviews_updated: removalRequestId ? true : false,
          source: "template_based",
          matched_phrase: aiAnalysis.matchedPhrase || null
        })
      }
    });

    return {
      success: true,
      campaignId,
      emailThreadId: emailThread.id,
      ai_parsed_action: parsedAction,
      response_code: responseCode,
      ai_summary: aiAnalysis.summary,
      ai_confidence: aiAnalysis.confidence,
      draft_generated: parsedAction === "NEEDS_INFO" && responseCode !== "UNKNOWN"
    };
  }

  return { success: false, reason: "No campaign associated" };
}
