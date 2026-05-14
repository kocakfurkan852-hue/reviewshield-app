import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return null;

  // Global Stats
  const totalReviews = await prisma.review.count();
  const deletedReviews = await prisma.review.count({ where: { status: 'APPROVED' } });
  const pendingReviews = await prisma.review.count({ where: { status: { in: ['PENDING', 'SUBMITTED'] } } });
  
  // Client Stats
  const clients = await prisma.client.findMany({
    include: {
      campaigns: {
        include: {
          reviews: true
        }
      }
    }
  });

  const clientStats = clients.map(client => {
    let total = 0;
    let deleted = 0;
    
    client.campaigns.forEach(c => {
      total += c.reviews.length;
      deleted += c.reviews.filter(r => r.status === 'APPROVED').length;
    });

    const successRate = total > 0 ? Math.round((deleted / total) * 100) : 0;

    return {
      name: client.company_name,
      total,
      deleted,
      successRate
    };
  }).sort((a, b) => b.total - a.total);

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-heading font-bold text-foreground mb-2">Global Analytics</h1>
        <p className="text-muted-foreground mb-8">System-wide performance and client success metrics.</p>

        {/* Top KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="vault-card p-6 rounded-md">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Total Tracked</h3>
            <div className="text-5xl font-bold text-foreground">{totalReviews}</div>
          </div>
          <div className="vault-card p-6 rounded-md border-primary/30">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Successfully Deleted</h3>
            <div className="text-5xl font-bold text-primary">{deletedReviews}</div>
          </div>
          <div className="vault-card p-6 rounded-md border-amber-500/30">
            <h3 className="text-sm font-semibold text-amber-500 uppercase tracking-wider mb-2">In Progress</h3>
            <div className="text-5xl font-bold text-amber-500">{pendingReviews}</div>
          </div>
        </div>

        {/* Client Leaderboard */}
        <h2 className="text-2xl font-heading font-bold text-foreground mb-4">Client Performance</h2>
        <div className="vault-card rounded-md overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-card/50">
              <tr>
                <th className="px-6 py-4">Client Name</th>
                <th className="px-6 py-4">Tracked Reviews</th>
                <th className="px-6 py-4">Deleted</th>
                <th className="px-6 py-4">Success Rate</th>
              </tr>
            </thead>
            <tbody>
              {clientStats.map((client, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-card/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">{client.name}</td>
                  <td className="px-6 py-4 font-mono">{client.total}</td>
                  <td className="px-6 py-4 font-mono text-primary font-bold">{client.deleted}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: `${client.successRate}%` }}></div>
                      </div>
                      <span className="font-mono text-xs">{client.successRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
