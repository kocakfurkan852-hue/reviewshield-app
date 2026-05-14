"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/app/actions/client";

export function ClientForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      company_name: formData.get("company_name") as string,
      contact_name: formData.get("contact_name") as string,
      contact_email: formData.get("contact_email") as string,
      phone: formData.get("phone") as string,
      notes: formData.get("notes") as string,
    };

    try {
      await createClient(data);
      router.push("/dashboard/admin/clients");
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setError((err as any).message || "An error occurred");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error && <div className="text-destructive font-medium">{error}</div>}
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="company_name">Company Name *</Label>
            <Input id="company_name" name="company_name" required placeholder="Sternrecht GmbH" className="bg-transparent border-border text-foreground" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contact_name">Contact Person *</Label>
            <Input id="contact_name" name="contact_name" required placeholder="Max Mustermann" className="bg-transparent border-border text-foreground" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_email">Email Address *</Label>
            <Input id="contact_email" name="contact_email" type="email" required placeholder="max@example.com" className="bg-transparent border-border text-foreground" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" name="phone" placeholder="+49 123 456789" className="bg-transparent border-border text-foreground" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Internal Notes</Label>
          <textarea 
            id="notes" 
            name="notes" 
            rows={4} 
            className="flex w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Add any specific requirements or notes here..."
          ></textarea>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading} className="border-border text-foreground">
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="starlight-btn">
          {loading ? "Creating..." : "Save Client"}
        </Button>
      </div>
    </form>
  );
}
