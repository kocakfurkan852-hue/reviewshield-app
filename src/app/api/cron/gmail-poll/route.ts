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
    const settings = await prisma.systemSetting.findMany();
    const getSetting = (k: string, defaultVal: string) => settings.find(s => s.setting_key === k)?.setting_value || defaultVal;
    
    if (getSetting('EMAIL_SCAN_ENABLED', 'true') === 'false') {
        return NextResponse.json({ success: true, message: "Scanning disabled by admin." });
    }

    const frequency = getSetting('EMAIL_SCAN_FREQUENCY', 'HOURLY');
    const lastScanTime = parseInt(getSetting('LAST_SCAN_TIME', '0'), 10);
    const now = Date.now();
    const timeDiff = now - lastScanTime;
    
    if (frequency === 'DAILY' && timeDiff < 86400000) {
        return NextResponse.json({ success: true, message: "Skipping, daily threshold not met." });
    } else if (frequency === 'WEEKLY' && timeDiff < 604800000) {
        return NextResponse.json({ success: true, message: "Skipping, weekly threshold not met." });
    }

    await prisma.systemSetting.upsert({
        where: { setting_key: 'LAST_SCAN_TIME' },
        update: { setting_value: now.toString() },
        create: { setting_key: 'LAST_SCAN_TIME', setting_value: now.toString() }
    });

    const customQuery = getSetting('EMAIL_SCAN_QUERY', 'is:unread from:removals@google.com');

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
    console.error("Cron Job Error:", error);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
