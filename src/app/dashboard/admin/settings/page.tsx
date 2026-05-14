import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordForm } from "@/components/password-form";
import { revalidatePath } from "next/cache";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return null;

  const keys = ['EMAIL_SCAN_ENABLED', 'EMAIL_SCAN_FREQUENCY', 'EMAIL_SCAN_QUERY'];
  
  for (const key of keys) {
    await prisma.systemSetting.upsert({
      where: { setting_key: key },
      update: {},
      create: {
        setting_key: key,
        setting_value: key === 'EMAIL_SCAN_ENABLED' ? 'true' : key === 'EMAIL_SCAN_FREQUENCY' ? 'HOURLY' : 'is:unread from:removals@google.com',
      }
    });
  }

  const settings = await prisma.systemSetting.findMany({
    where: { setting_key: { in: keys } }
  });

  const getVal = (k: string) => settings.find(s => s.setting_key === k)?.setting_value || "";

  async function saveSystemSettings(formData: FormData) {
    "use server";
    for (const key of keys) {
      const val = formData.get(key) as string;
      if (val !== null) {
        await prisma.systemSetting.update({
          where: { setting_key: key },
          data: { setting_value: val }
        });
      }
    }
    revalidatePath('/dashboard/admin/settings');
  }

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <section>
          <h1 className="text-3xl font-heading font-bold text-foreground mb-2">My Account</h1>
          <p className="text-muted-foreground mb-4">Manage your personal account settings.</p>
          <div className="vault-card rounded-md p-6 border-border">
            <h2 className="text-xl font-semibold text-foreground mb-4">Change Password</h2>
            <PasswordForm />
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-heading font-bold text-foreground mb-2">System Settings</h2>
          <p className="text-muted-foreground mb-4">Manage global configuration for the AI agent and polling intervals.</p>
          <div className="vault-card rounded-md p-6 border-border">
            <form action={saveSystemSettings} className="space-y-6">
              
              <div className="space-y-2 pb-4 border-b border-border">
                <label className="font-semibold text-foreground block">Enable Automatic Email Scanning</label>
                <select name="EMAIL_SCAN_ENABLED" defaultValue={getVal('EMAIL_SCAN_ENABLED')} className="w-full max-w-md flex h-10 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground">
                  <option value="true">Enabled</option>
                  <option value="false">Disabled</option>
                </select>
              </div>

              <div className="space-y-2 pb-4 border-b border-border">
                <label className="font-semibold text-foreground block">Scanning Frequency</label>
                <p className="text-xs text-muted-foreground mb-2">How often should the background worker process new emails.</p>
                <select name="EMAIL_SCAN_FREQUENCY" defaultValue={getVal('EMAIL_SCAN_FREQUENCY')} className="w-full max-w-md flex h-10 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground">
                  <option value="HOURLY">Every Hour</option>
                  <option value="DAILY">Every Day</option>
                  <option value="WEEKLY">Every Week</option>
                </select>
              </div>

              <div className="space-y-2 pb-4 border-b border-border">
                <label className="font-semibold text-foreground block">Gmail Search Query</label>
                <p className="text-xs text-muted-foreground mb-2">Specify exactly which emails should be picked up (e.g., specific senders or subjects).</p>
                <Input 
                  name="EMAIL_SCAN_QUERY"
                  defaultValue={getVal('EMAIL_SCAN_QUERY')} 
                  placeholder="is:unread from:removals@google.com"
                  className="bg-transparent border-border text-foreground font-mono max-w-md"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="submit" className="starlight-btn">Save Settings</Button>
              </div>
            </form>
          </div>
        </section>

      </div>
    </div>
  );
}
