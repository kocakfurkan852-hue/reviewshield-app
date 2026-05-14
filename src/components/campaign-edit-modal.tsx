"use client";

import { useState, useEffect } from "react";
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
import { updateCampaign, getAgents } from "@/app/actions/campaign";
import { useRouter } from "next/navigation";
import { Edit2, Users } from "lucide-react";

export function CampaignEditModal({ campaign }: { campaign: any }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<string[]>(
    campaign.assignments.map((a: any) => a.user.id)
  );
  const router = useRouter();

  useEffect(() => {
    if (open) {
      loadAgents();
    }
  }, [open]);

  async function loadAgents() {
    try {
      const data = await getAgents();
      setAgents(data);
    } catch (err) {
      console.error("Failed to load agents", err);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      status: formData.get("status") as string,
      agent_ids: selectedAgents,
    };

    try {
      const result = await updateCampaign(campaign.id, data);
      if (result.success) {
        setOpen(false);
        router.refresh();
      }
    } catch (err) {
      setError((err as any).message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  const toggleAgent = (id: string) => {
    setSelectedAgents(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-primary/10">
          <Edit2 className="h-4 w-4 mr-2" />
          Edit Campaign
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md bg-background border-border">
        <DialogHeader>
          <DialogTitle>Edit Campaign Settings</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={onSubmit} className="space-y-4 py-4">
          {error && <div className="text-destructive bg-destructive/10 p-3 rounded text-sm">{error}</div>}
          
          <div className="space-y-2">
            <Label htmlFor="name">Campaign Name</Label>
            <Input id="name" name="name" defaultValue={campaign.name} required className="bg-transparent" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select 
              id="status" 
              name="status" 
              defaultValue={campaign.status}
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </div>

          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Assign Agents (Multiple)
            </Label>
            <div className="max-h-40 overflow-y-auto space-y-2 p-3 border border-border rounded-md bg-card/30">
              {agents.map(agent => (
                <label key={agent.id} className="flex items-center space-x-3 cursor-pointer p-1.5 hover:bg-white/5 rounded transition-colors">
                  <input 
                    type="checkbox" 
                    checked={selectedAgents.includes(agent.id)}
                    onChange={() => toggleAgent(agent.id)}
                    className="w-4 h-4 rounded border-border bg-background accent-primary"
                  />
                  <span className="text-sm text-foreground">{agent.name}</span>
                </label>
              ))}
              {agents.length === 0 && <p className="text-xs text-muted-foreground">Loading agents...</p>}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="starlight-btn" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
