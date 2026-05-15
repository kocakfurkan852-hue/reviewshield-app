import { getAdminDashboardStats } from "@/app/actions/dashboard";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminQuickActions } from "@/components/admin-quick-actions";

export default async function AdminDashboard() {
  const stats = await getAdminDashboardStats();

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-foreground">Admin Overview</h1>
          <AdminQuickActions />
        </div>
        
        {/* KPI Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="vault-card p-6 rounded-md">
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Active Campaigns</p>
            <p className="text-4xl font-heading font-bold text-foreground">{stats.activeCampaigns}</p>
          </div>
          <div className="vault-card p-6 rounded-md">
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Reviews Pending Action</p>
            <p className="text-4xl font-heading font-bold text-amber-500">{stats.pendingReviews}</p>
          </div>
          <div className="vault-card p-6 rounded-md">
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Sent for Deletion</p>
            <p className="text-4xl font-heading font-bold text-blue-500">{stats.submittedReviews}</p>
          </div>
          <div className="vault-card p-6 rounded-md">
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Successfully Deleted</p>
            <p className="text-4xl font-heading font-bold text-emerald-500">{stats.approvedReviews}</p>
          </div>
          <div className="vault-card p-6 rounded-md border border-primary/20 bg-primary/5">
            <p className="text-sm font-bold text-primary uppercase tracking-wider mb-2">Drafts Awaiting Approval</p>
            <p className="text-4xl font-heading font-bold text-foreground mb-2">{stats.pendingDrafts}</p>
            {stats.pendingDrafts > 0 && (
              <Link href="/dashboard/admin/approval-queue">
                <Button size="sm" className="w-full starlight-btn mt-2">Review Queue</Button>
              </Link>
            )}
          </div>
        </div>

        {/* Email Pipeline Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="vault-card p-6 rounded-md border border-blue-500/20 bg-blue-500/5">
            <p className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-2">📧 Emails Tracked</p>
            <p className="text-4xl font-heading font-bold text-foreground">{stats.totalEmails}</p>
            {stats.unprocessedEmails > 0 && (
              <p className="text-xs text-amber-400 mt-2 font-medium">
                ⚠ {stats.unprocessedEmails} unprocessed
              </p>
            )}
          </div>
          <div className="vault-card p-6 rounded-md border border-violet-500/20 bg-violet-500/5">
            <p className="text-sm font-bold text-violet-400 uppercase tracking-wider mb-2">⏰ Due Reminders</p>
            <p className="text-4xl font-heading font-bold text-foreground">{stats.dueReminders}</p>
            <p className="text-xs text-muted-foreground mt-2">Auto-sent daily at 8am UTC</p>
          </div>
          <div className="vault-card p-6 rounded-md">
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">🔍 Last Gmail Scan</p>
            <p className="text-lg font-heading font-semibold text-foreground">
              {stats.lastScanTime
                ? new Date(stats.lastScanTime).toLocaleString()
                : "Never"
              }
            </p>
            <p className="text-xs text-muted-foreground mt-2">Scans every 2 hours</p>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 vault-card rounded-md">
            <div className="p-4 border-b border-border bg-card/50">
              <h2 className="text-xl font-heading font-semibold text-foreground">Quick Actions</h2>
            </div>
            <div className="p-6 flex flex-wrap gap-4">
              <Link href="/dashboard/admin/clients/new">
                <Button className="starlight-btn">Create New Client</Button>
              </Link>
              <Link href="/dashboard/admin/templates">
                <Button variant="outline" className="border-border text-foreground">Manage Templates</Button>
              </Link>
              <Link href="/dashboard/admin/knowledge">
                <Button variant="outline" className="border-border text-foreground">AI Knowledge Base</Button>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-1 vault-card rounded-md flex flex-col h-full">
            <div className="p-4 border-b border-border bg-card/50">
              <h2 className="text-xl font-heading font-semibold text-foreground">Recent Activity</h2>
            </div>
            <div className="p-0 flex-1">
              {stats.recentLogs.map((log, i) => (
                <div key={log.id} className={`p-4 border-b border-border/50 text-sm ${i % 2 === 0 ? 'bg-background/50' : ''}`}>
                  <p className="font-semibold text-foreground">{log.action}</p>
                  <p className="text-muted-foreground mt-1 text-xs">{log.user?.name || "System"} • {new Date(log.created_at).toLocaleString()}</p>
                </div>
              ))}
              {stats.recentLogs.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-sm">No recent activity.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
