import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";
import { StarsBackground } from "@/components/stars-background";
import { redirect } from "next/navigation";

export default async function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-transparent overflow-hidden selection:bg-primary/30">
      <StarsBackground />
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
