import { getTemplates } from "@/app/actions/template";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function TemplatesPage() {
  const templates = await getTemplates();

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Template Library</h1>
            <p className="text-muted-foreground mt-1">Manage standard email responses sent to Google.</p>
          </div>
          <Link href="/dashboard/admin/templates/new">
            <Button className="starlight-btn">+ New Template</Button>
          </Link>
        </div>

        <div className="vault-card rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template Name</TableHead>
                <TableHead>Scenario</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Version</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No templates found. Click &quot;New Template&quot; to create one.
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((tpl) => (
                  <TableRow key={tpl.id}>
                    <TableCell className="font-medium text-foreground">
                      {tpl.name}
                      {tpl.is_default && <span className="ml-2 text-[10px] uppercase tracking-wider bg-primary/20 text-primary px-2 py-0.5 rounded-full">Default</span>}
                    </TableCell>
                    <TableCell>{tpl.scenario_key}</TableCell>
                    <TableCell>{tpl.language}</TableCell>
                    <TableCell>
                      {tpl.active ? (
                        <span className="text-emerald-500 font-medium text-sm">Active</span>
                      ) : (
                        <span className="text-muted-foreground font-medium text-sm">Inactive</span>
                      )}
                    </TableCell>
                    <TableCell>v{tpl.version}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" className="border-border text-foreground">Edit</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
