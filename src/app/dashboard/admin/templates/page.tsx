import { getKnowledgeEntries } from "@/app/actions/knowledge";
import { getTemplates } from "@/app/actions/template";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SystemIntelligenceView } from "@/components/system-intelligence-view";

export default async function TemplatesPage() {
  const [entries, templates] = await Promise.all([
    getKnowledgeEntries(),
    getTemplates()
  ]);

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">System Intelligence</h1>
            <p className="text-muted-foreground mt-1">Manage legal knowledge and automated email templates.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard/admin/templates/new">
              <Button variant="outline" className="border-border text-foreground">New Template</Button>
            </Link>
            <Link href="/dashboard/admin/knowledge/new">
              <Button className="starlight-btn">+ New Entry</Button>
            </Link>
          </div>
        </div>

        <SystemIntelligenceView knowledgeEntries={entries} templates={templates} />
      </div>
    </div>
  );
}
