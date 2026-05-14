"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createKnowledgeEntry } from "@/app/actions/knowledge";

export function KnowledgeForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title") as string,
      category: formData.get("category") as "LEGAL_TEMPLATE" | "DELETION_PROCESS" | "GOOGLE_TOS" | "CASE_LAW" | "CUSTOM",
      content: formData.get("content") as string,
      source: formData.get("source") as string,
      tags: formData.get("tags") as string,
    };

    try {
      await createKnowledgeEntry(data);
      router.push("/dashboard/admin/knowledge");
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setError((err as any).message || "An error occurred");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error && <div className="text-destructive font-medium">{error}</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Entry Title *</Label>
          <Input id="title" name="title" required placeholder="BGH Urteil bzgl. Meinungsfreiheit" className="bg-transparent border-border text-foreground" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <select 
            id="category" 
            name="category" 
            required 
            defaultValue="LEGAL_TEMPLATE"
            className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
          >
            <option value="LEGAL_TEMPLATE">Legal Template</option>
            <option value="DELETION_PROCESS">Deletion Process</option>
            <option value="GOOGLE_TOS">Google Terms of Service</option>
            <option value="CASE_LAW">Case Law (Urteile)</option>
            <option value="CUSTOM">Custom Notes</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="source">Source / Link</Label>
          <Input id="source" name="source" placeholder="e.g. BGH, Urteil vom XX.XX.XXXX - VI ZR XXX/XX" className="bg-transparent border-border text-foreground" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tags">Tags (comma separated)</Label>
          <Input id="tags" name="tags" placeholder="BGH, Beleidigung, Schmähkritik" className="bg-transparent border-border text-foreground" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content / Argumentation *</Label>
        <textarea 
          id="content" 
          name="content" 
          rows={10} 
          required
          className="flex w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          placeholder={`Enter the exact legal text, argument, or rule for the AI to utilize...`}
        ></textarea>
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading} className="border-border text-foreground">
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="starlight-btn">
          {loading ? "Saving..." : "Save Entry"}
        </Button>
      </div>
    </form>
  );
}
