"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTemplate } from "@/app/actions/template";

export function TemplateForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      scenario_key: formData.get("scenario_key") as string,
      subject_line: formData.get("subject_line") as string,
      body_text: formData.get("body_text") as string,
      language: formData.get("language") as "DE" | "EN",
      is_default: formData.get("is_default") === "on",
    };

    try {
      await createTemplate(data);
      router.push("/dashboard/admin/templates");
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
          <Label htmlFor="name">Template Name *</Label>
          <Input id="name" name="name" required placeholder="Initial Removal Request (DE)" className="bg-transparent border-border text-foreground" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="scenario_key">Scenario Key *</Label>
          <select 
            id="scenario_key" 
            name="scenario_key" 
            required 
            defaultValue="INITIAL_REQUEST"
            className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
          >
            <option value="INITIAL_REQUEST">Initial Request (Form)</option>
            <option value="GOOGLE_AUTO_REPLY">Google Auto Reply (RQ1)</option>
            <option value="FOLLOW_UP_1">Follow-up 1</option>
            <option value="FOLLOW_UP_FINAL">Final Follow-up</option>
            <option value="ESCALATION_LEGAL">Legal Escalation</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="language">Language *</Label>
          <select 
            id="language" 
            name="language" 
            required 
            defaultValue="DE"
            className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
          >
            <option value="DE">German (DE)</option>
            <option value="EN">English (EN)</option>
          </select>
        </div>
        <div className="space-y-2 flex items-center pt-8">
          <input type="checkbox" id="is_default" name="is_default" className="w-4 h-4 mr-2" defaultChecked />
          <Label htmlFor="is_default">Set as default for this scenario/language</Label>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject_line">Subject Line *</Label>
        <Input id="subject_line" name="subject_line" required placeholder="Re: [Ticket ID] Review for {{client_name}}" className="bg-transparent border-border text-foreground" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="body_text">Email Body *</Label>
        <p className="text-xs text-muted-foreground mb-2">
          Available placeholders: <code>{'{{client_name}}'}</code>, <code>{'{{reviewer_name}}'}</code>, <code>{'{{review_text}}'}</code>, <code>{'{{google_ticket_id}}'}</code>, <code>{'{{review_url}}'}</code>
        </p>
        <textarea 
          id="body_text" 
          name="body_text" 
          rows={12} 
          required
          className="flex w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 font-mono"
          placeholder={`Dear Google Support Team,\n\nWe act on behalf of our client {{client_name}}.\n...`}
        ></textarea>
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading} className="border-border text-foreground">
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="starlight-btn">
          {loading ? "Saving..." : "Save Template"}
        </Button>
      </div>
    </form>
  );
}
