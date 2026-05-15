import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchUnreadEmails, markEmailAsRead } from "@/lib/gmail";
import { processEmail } from "@/lib/email-processor";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const customQuery = 'is:unread from:removals@google.com';
    const unreadMessages = await fetchUnreadEmails(customQuery);
    
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

      let bodyData = "";
      if (payload?.parts) {
        const textPart = payload.parts.find((p) => p.mimeType === "text/plain");
        if (textPart && textPart.body?.data) {
          bodyData = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
        }
      } else if (payload?.body?.data) {
        bodyData = Buffer.from(payload.body.data, 'base64').toString('utf-8');
      }

      const result = await processEmail({
        subject,
        bodyData,
        messageId,
        threadId
      });

      if (result.success) {
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
    console.error("Manual Sync Error:", error);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
