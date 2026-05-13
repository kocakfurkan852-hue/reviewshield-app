import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return null;

  const settings = await prisma.systemSetting.findMany();

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">System Settings</h1>
        <p className="text-muted-foreground mb-8">Manage global configuration for the AI agent and polling intervals.</p>
        
        <div className="vault-card rounded-md p-6 border-border">
          <form className="space-y-6">
            {settings.map((setting) => (
              <div key={setting.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center border-b border-border pb-4 last:border-0 last:pb-0">
                <div className="md:col-span-1">
                  <h3 className="font-semibold text-foreground">{setting.setting_key.replace(/_/g, ' ').toUpperCase()}</h3>
                </div>
                <div className="md:col-span-2">
                  <Input 
                    defaultValue={setting.setting_value} 
                    className="bg-transparent border-border text-foreground font-mono max-w-md"
                  />
                </div>
              </div>
            ))}
            
            <div className="pt-4 flex justify-end">
              <Button type="button" className="starlight-btn">Save Settings</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
