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
import { updateTemplate, deleteTemplate } from "@/app/actions/template";
import { useRouter } from "next/navigation";
import { Edit2, Trash2 } from "lucide-react";

export function TemplateEditModal({ template }: { template: any }) {
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
      name: formData.get("name") as string,
      scenario_key: formData.get("scenario_key") as string,
      language: formData.get("language") as "DE" | "EN",
      subject_line: formData.get("subject_line") as string,
      body_text: formData.get("body_text") as string,
      is_default: formData.get("is_default") === "on",
      active: formData.get("active") === "on",
    };

    try {
      const result = await updateTemplate(template.id, data);
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
    if (!confirm(`Are you sure you want to delete template "${template.name}"?`)) return;
    
    setLoading(true);
    try {
      await deleteTemplate(template.id);
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
          <DialogTitle>Edit Template</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={onSubmit} className="space-y-4 py-4">
          {error && <div className="text-destructive bg-destructive/10 p-3 rounded text-sm">{error}</div>}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input id="name" name="name" defaultValue={template.name} required className="bg-transparent" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scenario_key">Scenario Key</Label>
              <Input id="scenario_key" name="scenario_key" defaultValue={template.scenario_key} required className="bg-transparent font-mono text-sm" placeholder="e.g. REJECTION_RESPONSE" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <select 
                id="language" 
                name="language" 
                defaultValue={template.language}
                className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="DE">German (DE)</option>
                <option value="EN">English (EN)</option>
              </select>
            </div>
            <div className="flex items-center gap-6 mt-6">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  name="is_default"
                  defaultChecked={template.is_default}
                  className="w-4 h-4 rounded border-border bg-background accent-primary"
                />
                <span className="text-sm text-foreground">Default for Scenario</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  name="active"
                  defaultChecked={template.active}
                  className="w-4 h-4 rounded border-border bg-background accent-primary"
                />
                <span className="text-sm text-foreground">Active</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject_line">Email Subject</Label>
            <Input id="subject_line" name="subject_line" defaultValue={template.subject_line} required className="bg-transparent" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body_text">Email Body</Label>
            <textarea 
              id="body_text" 
              name="body_text" 
              required 
              defaultValue={template.body_text}
              className="flex min-h-[200px] w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 font-mono" 
            />
            <p className="text-xs text-muted-foreground mt-1">
              Available variables: {"{client_name}"}, {"{google_ticket_id}"}
            </p>
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
              Delete Template
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
