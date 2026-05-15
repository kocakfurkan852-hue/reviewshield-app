"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { updateKnowledgeEntry, deleteKnowledgeEntry } from "@/app/actions/knowledge";
import { useRouter } from "next/navigation";
import { Edit2, Trash2 } from "lucide-react";

export function KnowledgeEditModal({ entry }: { entry: any }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title") as string,
      category: formData.get("category") as any,
      content: formData.get("content") as string,
      source: formData.get("source") as string,
      tags: formData.get("tags") as string,
    };

    try {
      const result = await updateKnowledgeEntry(entry.id, data);
      if (result.success) {
        setOpen(false);
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete entry "${entry.title}"?`)) return;
    
    setLoading(true);
    try {
      await deleteKnowledgeEntry(entry.id);
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          <Edit2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-background border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Knowledge Entry</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={onSubmit} className="space-y-4 py-4">
          {error && <div className="text-destructive bg-destructive/10 p-3 rounded text-sm">{error}</div>}
          
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" defaultValue={entry.title} required className="bg-transparent" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select 
                id="category" 
                name="category" 
                defaultValue={entry.category}
                className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="LEGAL_TEMPLATE">LEGAL_TEMPLATE</option>
                <option value="DELETION_PROCESS">DELETION_PROCESS</option>
                <option value="GOOGLE_TOS">GOOGLE_TOS</option>
                <option value="CASE_LAW">CASE_LAW</option>
                <option value="CUSTOM">CUSTOM</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="source">Source (URL or reference)</Label>
              <Input id="source" name="source" defaultValue={entry.source} required className="bg-transparent" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input id="tags" name="tags" defaultValue={entry.tags.join(", ")} className="bg-transparent" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <textarea 
              id="content" 
              name="content" 
              required 
              defaultValue={entry.content}
              className="flex min-h-[200px] w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 font-mono" 
            />
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-border">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={handleDelete}
              className="text-destructive hover:bg-destructive/10"
              disabled={loading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Entry
            </Button>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" className="starlight-btn" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
