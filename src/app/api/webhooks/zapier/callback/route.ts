import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/webhooks/zapier/callback?campaign_id=X&limit=10
// Returns recent EmailThread entries so Zapier can poll for AI results
// and branch on parsed_action (APPROVED → Slack ✅, REJECTED → Slack ❌, etc.)
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.EXTERNAL_API_KEY}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const campaignId = url.searchParams.get("campaign_id");
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);
    const since = url.searchParams.get("since"); // ISO date string

    const where: any = {};
    if (campaignId) where.campaign_id = campaignId;
    if (since) where.created_at = { gte: new Date(since) };

    const threads = await prisma.emailThread.findMany({
      where,
      select: {
        id: true,
        campaign_id: true,
        subject: true,
        ai_parsed_action: true,
        ai_summary: true,
        ai_confidence: true,
        google_response_type: true,
        direction: true,
        processed: true,
        received_at: true,
        created_at: true,
      },
      orderBy: { created_at: "desc" },
      take: Math.min(limit, 50),
    });

    return NextResponse.json({
      success: true,
      count: threads.length,
      threads,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Zapier Callback Error:", error);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
