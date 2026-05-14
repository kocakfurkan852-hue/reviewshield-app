import { getClientById } from "@/app/actions/client";
import { getClientCampaigns } from "@/app/actions/campaign";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DeleteCampaignButton } from "@/components/delete-campaign-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { notFound } from "next/navigation";

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  let client;
  let campaigns;
  
  try {
    client = await getClientById(params.id);
    campaigns = await getClientCampaigns(params.id);
  } catch {
    notFound();
  }

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="max-w-5xl mx-auto">
        <Link href="/dashboard/admin/clients">
          <Button variant="ghost" className="mb-4 pl-0 text-muted-foreground hover:text-foreground">
            ← Back to Clients
          </Button>
        </Link>
        
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">{client.company_name}</h1>
            <p className="text-muted-foreground mt-1">Contact: {client.contact_name} ({client.contact_email})</p>
          </div>
          <Link href={`/dashboard/admin/clients/${client.id}/campaigns/new`}>
            <Button className="starlight-btn">+ New Campaign</Button>
          </Link>
        </div>

        <div className="vault-card rounded-md">
          <div className="p-4 border-b border-border bg-card/50">
            <h2 className="text-xl font-heading font-semibold text-foreground">Active Campaigns</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign Name</TableHead>
                <TableHead>Assigned People</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reviews Tracked</TableHead>
                <TableHead>Removal Requests</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No campaigns found. Click &quot;New Campaign&quot; to start.
                  </TableCell>
                </TableRow>
              ) : (
                campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium text-foreground">{campaign.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {campaign.assignments.map((a: any) => (
                          <span key={a.user.id} className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
                            {a.user.name}
                          </span>
                        ))}
                        {campaign.assignments.length === 0 && <span className="text-xs text-muted-foreground italic">None</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold">
                        {campaign.status}
                      </span>
                    </TableCell>
                    <TableCell>{campaign._count.reviews}</TableCell>
                    <TableCell>{campaign._count.removal_requests}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/admin/campaigns/${campaign.id}`}>
                        <Button variant="outline" size="sm" className="mr-2 border-border text-foreground">Manage</Button>
                      </Link>
                      <DeleteCampaignButton id={campaign.id} name={campaign.name} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
