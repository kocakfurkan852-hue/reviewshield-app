import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AgentDashboard() {
  const session = await getServerSession(authOptions);
  
  if (!session) return null;

  const assignedCampaigns = await prisma.campaign.findMany({
    where: { 
      assignments: {
        some: {
          user_id: session.user.id
        }
      },
      status: 'ACTIVE'
    },
    include: {
      client: true,
      _count: {
        select: { reviews: true }
      }
    },
    orderBy: { updated_at: 'desc' }
  });

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Welcome, {session.user.name}</h1>
            <p className="text-muted-foreground mt-1">Here are your active assigned campaigns.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignedCampaigns.length === 0 ? (
            <div className="col-span-full vault-card p-12 text-center rounded-md border-dashed border-2 border-border">
              <p className="text-muted-foreground font-medium">You have no active campaigns assigned to you.</p>
            </div>
          ) : (
            assignedCampaigns.map(camp => (
              <div key={camp.id} className="vault-card p-6 rounded-md flex flex-col h-full border border-border/50 hover:border-primary/50 transition-colors">
                <div className="flex-1">
                  <h3 className="font-heading font-bold text-foreground text-lg mb-1">{camp.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{camp.client.company_name}</p>
                  
                  <div className="bg-background rounded-md p-3 border border-border flex justify-between items-center mb-6">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tracked Reviews</span>
                    <span className="font-bold text-foreground">{camp._count.reviews}</span>
                  </div>
                </div>
                
                <Link href={`/dashboard/agent/campaigns/${camp.id}`} className="block w-full">
                  <Button className="w-full starlight-btn">Manage Campaign</Button>
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
