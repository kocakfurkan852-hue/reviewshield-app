import { getKnowledgeEntries } from "@/app/actions/knowledge";
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

export default async function KnowledgeBasePage() {
  const entries = await getKnowledgeEntries();

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Knowledge Base</h1>
            <p className="text-muted-foreground mt-1">Manage legal arguments and AI fallback context.</p>
          </div>
          <Link href="/dashboard/admin/knowledge/new">
            <Button className="starlight-btn">+ New Entry</Button>
          </Link>
        </div>

        <div className="vault-card rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No knowledge base entries found. Click &quot;New Entry&quot; to create one.
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium text-foreground">{entry.title}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                        {entry.category}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {entry.tags.map((tag, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px]">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm truncate max-w-xs">{entry.source}</TableCell>
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
