"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createUser } from "@/app/actions/user";

export default function NewUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      role: formData.get("role") as "AGENT" | "ADMIN",
    };

    try {
      await createUser(data);
      router.push("/dashboard/admin/users");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Add New User</h1>
        <p className="text-muted-foreground mb-8">Create a new Agent or Admin account.</p>

        <div className="vault-card p-8 rounded-md">
          <form onSubmit={onSubmit} className="space-y-6">
            {error && <div className="text-destructive text-sm font-bold bg-destructive/10 p-3 rounded">{error}</div>}

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" required placeholder="John Doe" className="bg-background text-foreground border-border" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" name="email" type="email" required placeholder="john@sternrecht.com" className="bg-background text-foreground border-border" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select 
                id="role" 
                name="role" 
                required 
                className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="AGENT">Agent (Mitarbeiter)</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>
            
            <div className="pt-4 p-4 bg-muted/50 rounded text-sm text-muted-foreground border border-border/50">
              Note: The default password for new users will be <strong>password123</strong>. Please instruct them to change it after logging in.
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading} className="text-foreground border-border">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="starlight-btn">
                {loading ? "Creating..." : "Create User"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
