import { getOrphanedEmails } from "@/app/actions/email";
import { getClientsWithCampaigns } from "@/app/actions/client";
import { OrphanInboxView } from "./orphan-inbox-view";

export default async function OrphanInboxPage() {
  const [orphans, clients] = await Promise.all([
    getOrphanedEmails(),
    getClientsWithCampaigns()
  ]);

  return (
    <div className="p-8 bg-background min-h-screen flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-foreground flex items-center gap-3">
          Unassigned Inbox
          <span className="bg-amber-500 text-black text-sm font-bold px-3 py-1 rounded-full">
            {orphans.length}
          </span>
        </h1>
        <p className="text-muted-foreground mt-1">Google emails that couldn&apos;t be automatically linked to a campaign. Assign them manually to resume tracking.</p>
      </div>

      <div className="flex-1">
        <OrphanInboxView 
          initialOrphans={orphans} 
          clients={clients} 
        />
      </div>
    </div>
  );
}
