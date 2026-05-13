import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { revalidatePath } from "next/cache";

export default async function AISettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return null;

  // Ensure settings exist
  const keys = ['AI_PROVIDER', 'AI_SYSTEM_PROMPT', 'AI_MAX_SPEND', 'OPENAI_API_KEY', 'GEMINI_API_KEY'];
  
  for (const key of keys) {
    await prisma.systemSetting.upsert({
      where: { setting_key: key },
      update: {},
      create: {
        setting_key: key,
        setting_value: key === 'AI_PROVIDER' ? 'CLAUDE' : key === 'AI_SYSTEM_PROMPT' ? 'You are an expert lawyer specializing in reputation management...' : '',
        description: `Configuration for ${key}`
      }
    });
  }

  const settings = await prisma.systemSetting.findMany({
    where: { setting_key: { in: keys } }
  });

  const getVal = (k: string) => settings.find(s => s.setting_key === k)?.setting_value || "";

  async function saveSettings(formData: FormData) {
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
    revalidatePath('/dashboard/admin/ai-settings');
  }

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">AI Configuration</h1>
        <p className="text-muted-foreground mb-8">Manage LLM Providers, System Prompts, and API Keys.</p>
        
        <div className="vault-card rounded-md p-6 border-border">
          <form action={saveSettings} className="space-y-6">
            
            <div className="space-y-2 pb-4 border-b border-border">
              <label className="font-semibold text-foreground block">Active AI Provider</label>
              <select name="AI_PROVIDER" defaultValue={getVal('AI_PROVIDER')} className="w-full max-w-md flex h-10 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground">
                <option value="CLAUDE">Anthropic Claude (Haiku/Sonnet)</option>
                <option value="CHATGPT">OpenAI (GPT-4o)</option>
                <option value="GEMINI">Google Gemini (1.5 Pro)</option>
              </select>
            </div>

            <div className="space-y-2 pb-4 border-b border-border">
              <label className="font-semibold text-foreground block">System Prompt</label>
              <p className="text-xs text-muted-foreground mb-2">This dictates the core persona of the AI when parsing emails and writing drafts.</p>
              <textarea 
                name="AI_SYSTEM_PROMPT" 
                defaultValue={getVal('AI_SYSTEM_PROMPT')} 
                className="w-full h-32 rounded-md border border-border bg-background p-3 text-sm text-foreground"
              />
            </div>

            <div className="space-y-2 pb-4 border-b border-border">
              <label className="font-semibold text-foreground block">Max Spending per Message (USD)</label>
              <p className="text-xs text-muted-foreground mb-2">Used as a soft limit to prevent API abuse.</p>
              <Input 
                name="AI_MAX_SPEND"
                defaultValue={getVal('AI_MAX_SPEND')} 
                placeholder="e.g. 0.05"
                className="bg-transparent border-border text-foreground font-mono max-w-xs"
              />
            </div>

            <div className="space-y-2 pb-4 border-b border-border">
              <label className="font-semibold text-foreground block">OpenAI API Key</label>
              <Input 
                name="OPENAI_API_KEY"
                type="password"
                defaultValue={getVal('OPENAI_API_KEY')} 
                placeholder="sk-..."
                className="bg-transparent border-border text-foreground font-mono max-w-md"
              />
            </div>

            <div className="space-y-2 pb-4 border-b border-border">
              <label className="font-semibold text-foreground block">Gemini API Key</label>
              <Input 
                name="GEMINI_API_KEY"
                type="password"
                defaultValue={getVal('GEMINI_API_KEY')} 
                placeholder="AIza..."
                className="bg-transparent border-border text-foreground font-mono max-w-md"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit" className="starlight-btn">Save AI Settings</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
