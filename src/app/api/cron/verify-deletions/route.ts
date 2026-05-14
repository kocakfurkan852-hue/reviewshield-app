import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Cron: Verify if Google actually deleted reviews that were marked as APPROVED
// Schedule: Weekly (Monday 6am UTC) — configured in vercel.json
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.EXTERNAL_API_KEY}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find all reviews with status APPROVED that haven't been confirmed as deleted
    const approvedReviews = await prisma.review.findMany({
      where: {
        status: "APPROVED",
        deleted_at: null, // Not yet confirmed deleted
      },
      select: {
        id: true,
        review_url: true,
        campaign_id: true,
        resolved_at: true,
      },
    });

    if (approvedReviews.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No approved reviews to verify.",
        checked: 0,
      });
    }

    let confirmedDeleted = 0;
    let stillLive = 0;
    let errors = 0;

    for (const review of approvedReviews) {
      try {
        // Make a HEAD request to the review URL to check if it's still live
        const response = await fetch(review.review_url, {
          method: "HEAD",
          redirect: "follow",
          signal: AbortSignal.timeout(10000), // 10s timeout
        });

        if (response.status === 404 || response.status === 410) {
          // Review has been deleted — confirm it
          await prisma.review.update({
            where: { id: review.id },
            data: { deleted_at: new Date() },
          });
          confirmedDeleted++;
        } else {
          stillLive++;

          // If it's been more than 30 days since APPROVED but still live, flag it
          const daysSinceApproval = review.resolved_at
            ? Math.floor(
                (Date.now() - new Date(review.resolved_at).getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            : 0;

          if (daysSinceApproval > 30) {
            // Log for manual review
            await prisma.auditLog.create({
              data: {
                action: "REVIEW_STILL_LIVE_30_DAYS",
                entity_type: "REVIEW",
                entity_id: review.id,
                metadata: JSON.stringify({
                  review_url: review.review_url,
                  days_since_approval: daysSinceApproval,
                  campaign_id: review.campaign_id,
                }),
              },
            });
          }
        }
      } catch (fetchError) {
        // Network error — skip but log
        errors++;
        console.warn(
          `Could not verify review ${review.id} at ${review.review_url}:`,
          fetchError
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Verification complete. ${confirmedDeleted} confirmed deleted, ${stillLive} still live, ${errors} errors.`,
      checked: approvedReviews.length,
      confirmedDeleted,
      stillLive,
      errors,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Verify Deletions Cron Error:", error);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
