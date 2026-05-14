import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchUnreadEmails, markEmailAsRead } from "@/lib/gmail";
import { parseGoogleResponse } from "@/lib/claude";

export async function GET(req: Request) {
  // Simple auth for cron job using same EXTERNAL_API_KEY
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.EXTERNAL_API_KEY}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const unreadMessages = await fetchUnreadEmails();
    
    if (unreadMessages.length === 0) {
      return NextResponse.json({ success: true, message: "No new emails found.", processed: 0 });
    }

    let processedCount = 0;

    for (const msg of unreadMessages) {
      const payload = msg.payload;
      const headers = payload?.headers || [];
      const subjectHeader = headers.find((h) => h.name === "Subject");
      const messageIdHeader = headers.find((h) => h.name === "Message-ID");
      
      const subject = subjectHeader?.value || "No Subject";
      const messageId = messageIdHeader?.value || msg.id || "unknown";
      const threadId = msg.threadId || "";

      // Extremely simplified body extraction (for multipart emails, this requires parsing parts)
      let bodyData = "";
      if (payload?.parts) {
        const textPart = payload.parts.find((p) => p.mimeType === "text/plain");
        if (textPart && textPart.body?.data) {
          bodyData = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
        }
      } else if (payload?.body?.data) {
        bodyData = Buffer.from(payload.body.data, 'base64').toString('utf-8');
      }

      // We need to associate this email with a campaign.
      // In production, you'd extract a unique Google Ticket ID and look it up in RemovalRequest,
      // or find the associated campaign via the original out-bound thread ID.
      // For this implementation, we will try to extract ticket ID from subject e.g., [Ticket ID: 1-12345]
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

      // If we still don't have a campaign ID, we might just store it as unassigned or skip.
      // Let's assume we store it anyway if it's from google, and an admin can assign it later.
      if (!campaignId) {
        // Fallback: Pick the first active campaign for demo purposes if nothing matches.
        // In reality, this email would go to an "Unassigned Inbox".
        const fallback = await prisma.campaign.findFirst({ where: { status: 'ACTIVE' } });
        if (fallback) campaignId = fallback.id;
      }

      if (campaignId && threadId) {
        // Parse with Claude
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

        if (msg.id) {
          await markEmailAsRead(msg.id);
        }
        processedCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully processed ${processedCount} emails.`,
      processed: processedCount
    });

  } catch (error: unknown) {
    const err = error as Error;
    console.error("Cron Job Error:", error);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
