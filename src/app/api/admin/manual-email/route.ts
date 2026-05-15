import { NextResponse } from "next/server";
import { processEmail } from "@/lib/email-processor";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { subject, bodyData, messageId, threadId, campaignId } = body;

    if (!subject || !bodyData) {
      return NextResponse.json({ error: "Subject and bodyData are required." }, { status: 400 });
    }

    const result = await processEmail({
      subject,
      bodyData,
      messageId: messageId || "manual-" + Date.now(),
      threadId: threadId || "manual-thread",
      forcedCampaignId: campaignId || undefined
    });

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Failed to process email" }, { status: 500 });
    }
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Manual Email Entry Error:", error);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
