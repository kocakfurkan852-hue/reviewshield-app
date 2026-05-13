"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCampaign } from "@/app/actions/campaign";

interface Agent {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function CampaignForm({ clientId, agents }: { clientId: string, agents: Agent[] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      client_id: clientId,
      name: formData.get("name") as string,
      assigned_agent_id: formData.get("assigned_agent_id") as string,
    };

    try {
      await createCampaign(data);
      router.push(`/dashboard/admin/clients/${clientId}`);
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
        <div className="space-y-2">
          <Label htmlFor="name">Campaign Name *</Label>
          <Input id="name" name="name" required placeholder="e.g. Google Maps 2026 Cleanup" className="bg-transparent border-border text-foreground" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="assigned_agent_id">Assign Agent *</Label>
          <select 
            id="assigned_agent_id" 
            name="assigned_agent_id" 
            required 
            defaultValue=""
            className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
          >
            <option value="" disabled>Select an agent...</option>
            {agents.map(agent => (
              <option key={agent.id} value={agent.id}>
                {agent.name} ({agent.role})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading} className="border-border text-foreground">
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="starlight-btn">
          {loading ? "Creating..." : "Save Campaign"}
        </Button>
      </div>
    </form>
  );
}
