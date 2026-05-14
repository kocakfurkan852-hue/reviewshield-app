import { getCampaignById } from "@/app/actions/review";
import { getCampaignEmails } from "@/app/actions/campaign";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ReviewImporter } from "./review-importer";
import { BookmarkletGenerator } from "./bookmarklet-generator";
import { ReviewTable } from "./review-table";
import { EmailTimeline } from "./email-timeline";
import { CampaignEditModal } from "@/components/campaign-edit-modal";
import { notFound } from "next/navigation";

export default async function CampaignDetailPage({ params }: { params: { id: string } }) {
  let campaign;
  try {
    campaign = await getCampaignById(params.id);
  } catch {
    notFound();
  }

  const emails = await getCampaignEmails(params.id);

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <Link href={`/dashboard/admin/clients/${campaign.client_id}`}>
              <Button variant="ghost" className="mb-4 pl-0 text-muted-foreground hover:text-foreground">
                ← Back to {campaign.client.company_name}
              </Button>
            </Link>
            <h1 className="text-3xl font-heading font-bold text-foreground">{campaign.name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-sm text-muted-foreground">Assigned to:</span>
              {campaign.assignments.map((a: any) => (
                <span key={a.user.id} className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground font-medium">
                  {a.user.name}
                </span>
              ))}
              {campaign.assignments.length === 0 && <span className="text-xs text-muted-foreground italic">No one assigned</span>}
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <span className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-semibold">
              Status: {campaign.status}
            </span>
            <CampaignEditModal campaign={campaign} />
          </div>
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="flex gap-4">
          <a href={`/api/reports/${campaign.id}`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="border-border text-foreground hover:bg-primary/10 hover:text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M10 18H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9l5 5v11a2 2 0 0 1-2 2h-5"></path><polyline points="15 15 12 18 9 15"></polyline><line x1="12" y1="12" x2="12" y2="18"></line></svg>
              Generate PDF Report
            </Button>
          </a>
          <ReviewImporter campaignId={campaign.id} />
        </div>
          
          <div className="lg:col-span-2 vault-card p-6 rounded-md flex flex-col justify-center">
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

        <div className="vault-card rounded-md">
          <div className="p-4 border-b border-border bg-card/50">
            <h2 className="text-xl font-heading font-semibold text-foreground">Tracked Reviews</h2>
          </div>
          <ReviewTable campaignId={campaign.id} reviews={campaign.reviews} client={campaign.client} />
        </div>

        <div className="vault-card rounded-md mt-8">
          <div className="p-4 border-b border-border bg-card/50">
            <h2 className="text-xl font-heading font-semibold text-foreground flex items-center gap-2">
              📧 Email Activity
              <span className="text-sm font-normal text-muted-foreground">({emails.length})</span>
            </h2>
          </div>
          <div className="p-4">
            <EmailTimeline emails={emails} />
          </div>
        </div>
      </div>
    </div>
  );
}
