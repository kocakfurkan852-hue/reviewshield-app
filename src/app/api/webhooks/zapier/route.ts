import { NextResponse } from "next/server";
import { processEmail } from "@/lib/email-processor";

export async function POST(req: Request) {
  // Simple auth for Zapier webhook using EXTERNAL_API_KEY
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.EXTERNAL_API_KEY}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    
    // Zapier should send: subject, body, messageId, threadId
    const { subject, body, messageId, threadId } = data;

    if (!subject || !body || !messageId || !threadId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const result = await processEmail({
      subject,
      bodyData: body,
      messageId,
      threadId
    });

    return NextResponse.json(result);

  } catch (error: unknown) {
    const err = error as Error;
    console.error("Zapier Webhook Error:", error);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
