import { getClientById } from "@/app/actions/client";
import { getAgents } from "@/app/actions/campaign";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CampaignForm } from "./campaign-form";
import { notFound } from "next/navigation";

export default async function NewCampaignPage({ params }: { params: { id: string } }) {
  let client;
  let agents;
  
  try {
    client = await getClientById(params.id);
    agents = await getAgents();
  } catch {
    notFound();
  }

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href={`/dashboard/admin/clients/${client.id}`}>
            <Button variant="ghost" className="mb-4 pl-0 text-muted-foreground hover:text-foreground">
              ← Back to Client
            </Button>
          </Link>
          <h1 className="text-3xl font-heading font-bold text-foreground">Create Campaign</h1>
          <p className="text-muted-foreground mt-1">Start a new review deletion campaign for {client.company_name}.</p>
        </div>
        
        <div className="vault-card p-6">
          <CampaignForm clientId={client.id} agents={agents} />
        </div>
      </div>
    </div>
  );
}
