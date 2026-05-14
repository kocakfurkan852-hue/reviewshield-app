import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PasswordForm } from "@/components/password-form";

export default async function AgentSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  return (
    <div className="p-8 bg-transparent min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <section>
          <h1 className="text-3xl font-heading font-bold text-foreground mb-2">My Account</h1>
          <p className="text-muted-foreground mb-4">Manage your personal account settings.</p>
          <div className="vault-card rounded-md p-6 border-border/50 bg-card/30 backdrop-blur-md shadow-xl">
            <h2 className="text-xl font-semibold text-foreground mb-4">Change Password</h2>
            <PasswordForm />
          </div>
        </section>

      </div>
    </div>
  );
}
