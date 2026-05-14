import { prisma } from "@/lib/prisma";
import { parseGoogleResponse } from "@/lib/claude";

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
  // We need to associate this email with a campaign.
  // Extract ticket ID from subject e.g., [Ticket ID: 1-12345]
  const ticketMatch = subject?.match(/\[Ticket ID: ([^\]]+)\]/);
  const googleTicketId = ticketMatch ? ticketMatch[1] : null;

  let campaignId = null;

  if (googleTicketId) {
    const request = await prisma.removalRequest.findFirst({
      where: { google_reference_id: googleTicketId },
      select: { campaign_id: true }
    });
    if (request) campaignId = request.campaign_id;
  }

  // Fallback: Pick the first active campaign if nothing matches.
  if (!campaignId) {
    const fallback = await prisma.campaign.findFirst({ where: { status: 'ACTIVE' } });
    if (fallback) campaignId = fallback.id;
  }

  if (campaignId && threadId) {
    // Parse with AI
    const aiAnalysis = await parseGoogleResponse(bodyData, subject || "");

    await prisma.emailThread.create({
      data: {
        campaign_id: campaignId,
        gmail_thread_id: threadId,
        gmail_message_id: messageId,
        subject: subject || "Unknown Subject",
        received_at: new Date(),
        direction: "INBOUND",
        raw_body: bodyData,
        ai_summary: aiAnalysis.summary,
        ai_parsed_action: aiAnalysis.parsedAction as "APPROVED" | "REJECTED" | "NEEDS_INFO" | "UNKNOWN",
        ai_confidence: aiAnalysis.confidence,
        google_response_type: aiAnalysis.googleResponseType,
        processed: false
      }
    });

    return { success: true, campaignId };
  }

  return { success: false, reason: "No campaign associated" };
}
