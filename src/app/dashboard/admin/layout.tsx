import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  
  return (
    <div className="flex h-screen bg-transparent overflow-hidden selection:bg-primary/30">
      <Sidebar 
        userEmail={session?.user?.email} 
        userRole={session?.user?.role} 
        userPermissions={(session?.user as any)?.permissions || []} 
      />
      <main className="flex-1 overflow-auto relative bg-background/50 backdrop-blur-3xl">
        {children}
      </main>
    </div>
  );
}
