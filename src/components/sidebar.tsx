"use client";

import Link from "next/link";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { 
  OverviewIcon, 
  AnalyticsIcon, 
  ClientsIcon, 
  ApprovalIcon, 
  KnowledgeIcon, 
  AIIcon, 
  UsersIcon, 
  SettingsIcon 
} from "@/components/icons";

export function Sidebar({ 
  userEmail, 
  userRole, 
  userPermissions = [] 
}: { 
  userEmail: string | undefined, 
  userRole: string | undefined,
  userPermissions?: string[]
}) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const session = useSession();
  const sessionData = session?.data;
  const status = session?.status;
  
  if (status === "loading") {
    return <div className="w-64 bg-card border-r border-border" />;
  }
  
  const isAdmin = userRole === "ADMIN";

  const adminLinks = [
    { href: "/dashboard/admin", label: "Overview", icon: <OverviewIcon />, permission: "view_dashboard" },
    { href: "/dashboard/admin/analytics", label: "Analytics", icon: <AnalyticsIcon />, permission: "view_analytics" },
    { href: "/dashboard/admin/clients", label: "Clients", icon: <ClientsIcon />, permission: "manage_clients" },
    { href: "/dashboard/admin/approval-queue", label: "Approvals", icon: <ApprovalIcon />, permission: "approve_drafts" },
    { href: "/dashboard/admin/knowledge", label: "Knowledge", icon: <KnowledgeIcon />, permission: "manage_knowledge" },
    { href: "/dashboard/admin/ai-settings", label: "AI Config", icon: <AIIcon />, permission: "manage_settings" },
    { href: "/dashboard/admin/users", label: "Users", icon: <UsersIcon />, permission: "manage_users" },
    { href: "/dashboard/admin/settings", label: "Settings", icon: <SettingsIcon />, permission: "manage_settings" },
  ];

  const agentLinks = [
    { href: "/dashboard/agent", label: "My Campaigns", icon: <OverviewIcon />, permission: "view_dashboard" },
    { href: "/dashboard/agent/settings", label: "My Account", icon: <SettingsIcon />, permission: "view_dashboard" },
  ];

  const rawLinks = isAdmin ? adminLinks : agentLinks;
  const links = rawLinks.filter(link => isAdmin || userPermissions.includes(link.permission));


  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        className="md:hidden fixed top-4 right-4 z-50 p-2 bg-card border border-border rounded-md shadow-sm"
        onClick={() => setCollapsed(!collapsed)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
      </button>

      <aside className={`
        fixed md:static inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out
        ${collapsed ? '-translate-x-full md:translate-x-0 w-64 md:w-20' : 'translate-x-0 w-64'}
        border-r border-border bg-card/40 backdrop-blur-xl flex flex-col shadow-2xl
      `}>
        <div className="p-4 flex items-center justify-between border-b border-border/50">
          {!collapsed && (
            <div>
              <h2 className="text-xl font-heading font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-emerald-400">ReviewShield</h2>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">{isAdmin ? 'Administrator' : 'Agent Access'}</p>
            </div>
          )}
          {collapsed && (
            <h2 className="text-xl font-heading font-bold text-primary mx-auto">RS</h2>
          )}
          <button className="hidden md:block text-muted-foreground hover:text-foreground p-1 transition-colors" onClick={() => setCollapsed(!collapsed)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="m16 15-3-3 3-3"/></svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          {links.map((link) => (
            <NavItem 
              key={link.href}
              href={link.href} 
              label={link.label} 
              collapsed={collapsed} 
              icon={link.icon} 
              active={pathname === link.href}
            />
          ))}
        </nav>

        <div className={`p-4 border-t border-border/50 mt-auto flex flex-col gap-4 ${collapsed ? 'items-center px-2' : ''}`}>
          <div className="flex justify-between items-center w-full">
            {!collapsed && (
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                  {sessionData?.user?.name?.[0] || userEmail?.[0] || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{sessionData?.user?.name || "User"}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{sessionData?.user?.email || userEmail}</p>
                </div>
              </div>
            )}
            <ThemeToggle />
          </div>
          
          <button 
            onClick={async () => {
              await signOut({ callbackUrl: '/login' });
            }}
            className={`flex items-center gap-3 w-full py-2.5 rounded-lg text-sm font-medium transition-all group ${
              collapsed ? 'justify-center text-destructive hover:bg-destructive/10' : 'px-4 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
            {!collapsed && <span>Log Out</span>}
          </button>

        </div>
      </aside>

      {/* Overlay for mobile */}
      {!collapsed && <div className="fixed inset-0 bg-background/60 backdrop-blur-sm md:hidden z-30" onClick={() => setCollapsed(true)} />}
    </>
  );
}

function NavItem({ href, label, collapsed, icon, active }: { href: string, label: string, collapsed: boolean, icon: React.ReactNode, active: boolean }) {
  return (
    <Link 
      href={href} 
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
        active 
          ? 'bg-primary/15 text-primary border border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.1)]' 
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
      title={collapsed ? label : undefined}
    >
      <span className={`transition-colors ${active ? 'text-primary' : 'group-hover:text-foreground'}`}>{icon}</span>
      {!collapsed && <span className="text-sm font-medium">{label}</span>}
      {!collapsed && active && <div className="ml-auto w-1 h-1 rounded-full bg-primary" />}
    </Link>
  );
}

