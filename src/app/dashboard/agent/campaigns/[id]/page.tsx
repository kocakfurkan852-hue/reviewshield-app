import { getCampaignById } from "@/app/actions/review";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ReviewImporter } from "@/app/dashboard/admin/campaigns/[id]/review-importer";
import { BookmarkletGenerator } from "@/app/dashboard/admin/campaigns/[id]/bookmarklet-generator";
import { ReviewTable } from "@/app/dashboard/admin/campaigns/[id]/review-table";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function AgentCampaignDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  let campaign;
  try {
    campaign = await getCampaignById(params.id);
  } catch {
    notFound();
  }

  // Security: Check if the campaign is actually assigned to this agent
  if (campaign.assigned_agent_id !== session.user.id && session.user.role !== 'ADMIN') {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-destructive">Unauthorized</h1>
        <p className="text-muted-foreground mt-2">You do not have permission to manage this campaign.</p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-transparent min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <Link href="/dashboard/agent">
              <Button variant="ghost" className="mb-4 pl-0 text-muted-foreground hover:text-foreground">
                ← Back to My Campaigns
              </Button>
            </Link>
            <h1 className="text-3xl font-heading font-bold text-foreground">{campaign.name}</h1>
            <p className="text-muted-foreground mt-1">
              Client: <span className="text-foreground font-medium">{campaign.client.company_name}</span>
            </p>
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-semibold mb-2">
              Status: {campaign.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="flex gap-4">
            <ReviewImporter campaignId={campaign.id} />
          </div>
          
          <div className="lg:col-span-2 vault-card p-6 rounded-md flex flex-col justify-center bg-card/30 backdrop-blur-md border-border/50">
            <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Campaign Stats</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-foreground">{campaign.reviews.length}</p>
                <p className="text-sm text-muted-foreground">Total Reviews</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-amber-500">{campaign.reviews.filter(r => r.status === 'PENDING').length}</p>
                <p className="text-sm text-muted-foreground">Pending Action</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-emerald-500">{campaign.reviews.filter(r => r.status === 'APPROVED').length}</p>
                <p className="text-sm text-muted-foreground">Successfully Deleted</p>
              </div>
            </div>
          </div>
        </div>
        
        <BookmarkletGenerator reviews={campaign.reviews} />

        <div className="vault-card rounded-md bg-card/30 backdrop-blur-md border-border/50">
          <div className="p-4 border-b border-border bg-card/50">
            <h2 className="text-xl font-heading font-semibold text-foreground">Tracked Reviews</h2>
          </div>
          <ReviewTable campaignId={campaign.id} reviews={campaign.reviews} client={campaign.client} />
        </div>
      </div>
    </div>
  );
}
