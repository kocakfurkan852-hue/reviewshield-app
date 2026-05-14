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
    const agentIds = Array.from(formData.getAll("agent_ids")) as string[];
    
    if (agentIds.length === 0) {
      setError("Please assign at least one agent.");
      setLoading(false);
      return;
    }

    const data = {
      client_id: clientId,
      name: formData.get("name") as string,
      agent_ids: agentIds,
    };

    try {
      await createCampaign(data);
      router.push(`/dashboard/admin/clients/${clientId}`);
    } catch (err) {
      setError((err as any).message || "An error occurred");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error && <div className="text-destructive font-medium bg-destructive/10 p-3 rounded">{error}</div>}
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Campaign Name *</Label>
          <Input id="name" name="name" required placeholder="e.g. Google Maps 2026 Cleanup" className="bg-transparent border-border text-foreground" />
        </div>

        <div className="space-y-2">
          <Label className="block mb-2">Assign Agents *</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 border border-border rounded-md bg-card/30">
            {agents.map(agent => (
              <label key={agent.id} className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-white/5 rounded-md transition-colors">
                <input 
                  type="checkbox" 
                  name="agent_ids" 
                  value={agent.id}
                  className="w-4 h-4 rounded border-border bg-background accent-primary"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">{agent.name}</span>
                  <span className="text-[10px] text-muted-foreground uppercase">{agent.role}</span>
                </div>
              </label>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground italic mt-1">Select one or more people to manage this campaign.</p>
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
