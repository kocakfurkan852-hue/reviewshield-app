import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  
  return (
    <div className="flex h-screen bg-background">
      <aside className="w-64 border-r border-border bg-card/50 backdrop-blur-md">
        <div className="p-6">
          <h2 className="text-xl font-heading font-bold text-foreground">ReviewShield</h2>
          <p className="text-sm text-muted-foreground mt-1">Admin Panel</p>
        </div>
        <nav className="px-4 space-y-2 mt-4">
          <Link href="/dashboard/admin" className="block px-4 py-2 rounded-md hover:bg-muted text-foreground transition-colors">Overview</Link>
          <Link href="/dashboard/admin/analytics" className="block px-4 py-2 rounded-md hover:bg-muted text-foreground transition-colors">Analytics</Link>
          <Link href="/dashboard/admin/clients" className="block px-4 py-2 rounded-md hover:bg-muted text-foreground transition-colors">Clients & Campaigns</Link>
          <Link href="/dashboard/admin/templates" className="block px-4 py-2 rounded-md hover:bg-muted text-foreground transition-colors">Template Library</Link>
          <Link href="/dashboard/admin/knowledge" className="block px-4 py-2 rounded-md hover:bg-muted text-foreground transition-colors">Knowledge Base</Link>
          <Link href="/dashboard/admin/approval-queue" className="block px-4 py-2 rounded-md hover:bg-muted text-foreground transition-colors">Approval Queue</Link>
          <Link href="/dashboard/admin/audit-logs" className="block px-4 py-2 rounded-md hover:bg-muted text-foreground transition-colors">Audit Logs</Link>
          <Link href="/dashboard/admin/settings" className="block px-4 py-2 rounded-md hover:bg-muted text-foreground transition-colors">System Settings</Link>
        </nav>
        <div className="absolute bottom-4 left-4 right-4 p-4 rounded-md vault-card flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{session?.user?.email}</p>
              <p className="text-xs text-muted-foreground mt-1">Role: {session?.user?.role}</p>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
