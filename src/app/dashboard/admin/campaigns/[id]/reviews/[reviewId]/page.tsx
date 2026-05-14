import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";

export default async function ReviewDetailPage({ params }: { params: { id: string; reviewId: string } }) {
  const review = await prisma.review.findUnique({
    where: { id: params.reviewId },
    include: {
      campaign: { include: { client: true } },
    }
  });

  if (!review) return notFound();

  // Fetch recent audit logs for this review
  const auditLogs = await prisma.auditLog.findMany({
    where: { entity_id: review.id },
    orderBy: { created_at: 'desc' },
    include: { user: true }
  });

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href={`/dashboard/admin/campaigns/${params.id}`}>
            <Button variant="ghost" className="mb-4 pl-0 text-muted-foreground hover:text-foreground">
              ← Back to Campaign: {review.campaign.name}
            </Button>
          </Link>
          <div className="flex justify-between items-start">
            <h1 className="text-3xl font-heading font-bold text-foreground">Review from {review.reviewer_name || "Unknown"}</h1>
            <span className={`px-4 py-1 rounded-full text-sm font-semibold ${
              review.status === 'PENDING' ? 'bg-border/50 text-foreground' : 
              review.status === 'SUBMITTED' ? 'bg-blue-500/20 text-blue-500' : 
              review.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-500' :
              'bg-destructive/20 text-destructive'
            }`}>
              Status: {review.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="vault-card p-6 rounded-md">
            <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Review Details</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Rating</p>
                <div className="flex text-amber-500 text-lg">
                  {"★".repeat(review.star_rating)}{"☆".repeat(5 - review.star_rating)}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Original Text</p>
                <p className="text-foreground mt-1 whitespace-pre-wrap">{review.review_text || <span className="italic text-muted-foreground">No text provided</span>}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Link</p>
                <a href={review.review_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                  {review.review_url}
                </a>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Added On</p>
                <p className="text-foreground">{new Date(review.created_at).toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="vault-card p-6 rounded-md">
            <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Deletion Process Status</h3>
            <div className="space-y-6">
              {auditLogs.length > 0 ? (
                <div className="relative border-l-2 border-border ml-3 space-y-6 pl-6">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="relative">
                      <div className="absolute -left-[31px] bg-background border-2 border-primary rounded-full w-4 h-4 mt-1"></div>
                      <p className="font-semibold text-foreground">{log.action}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(log.created_at).toLocaleString()} {log.user?.name ? `• by ${log.user.name}` : ''}
                      </p>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <pre className="mt-2 text-xs bg-muted p-2 rounded text-muted-foreground overflow-auto">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No process history available. Review has not been submitted yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
