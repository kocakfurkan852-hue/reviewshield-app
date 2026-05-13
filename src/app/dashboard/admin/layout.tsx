import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  
  return (
    <div className="flex h-screen bg-background overflow-hidden selection:bg-primary/30">
      <AdminSidebar userEmail={session?.user?.email} userRole={session?.user?.role} />
      <main className="flex-1 overflow-auto bg-muted/10 relative">

        {children}
      </main>
    </div>
  );
}
