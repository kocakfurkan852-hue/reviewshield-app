"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { RefreshCcw, MailPlus } from "lucide-react";
import { useRouter } from "next/navigation";

export function AdminQuickActions({ campaigns = [] }: { campaigns?: { id: string, name: string, client?: { company_name: string } }[] }) {
  const [syncing, setSyncing] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleManualSync = async () => {
    setSyncing(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/sync-emails", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setMessage(`Synced successfully. Processed ${data.processed} emails.`);
        router.refresh();
      } else {
        setMessage(data.error || "Failed to sync.");
      }
    } catch (err: any) {
      setMessage("Failed to trigger sync.");
    } finally {
      setSyncing(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProcessing(true);
    setMessage("");

    const formData = new FormData(e.currentTarget);
    const body = {
      subject: formData.get("subject"),
      bodyData: formData.get("bodyData"),
      campaignId: formData.get("campaignId") || undefined,
      messageId: "manual-" + Date.now(),
      threadId: "manual-thread"
    };

    try {
      // Create a temporary endpoint to call processEmail directly
      const res = await fetch("/api/admin/manual-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        setShowManualModal(false);
        setMessage("Email manually processed and classified!");
        router.refresh();
      } else {
        setMessage(data.error || "Failed to process email.");
      }
    } catch (err: any) {
      setMessage("Error processing email.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <div className="flex gap-4 mb-4">
        <Button 
          onClick={handleManualSync} 
          disabled={syncing}
          variant="outline"
          className="border-primary/20 text-primary hover:bg-primary/10"
        >
          <RefreshCcw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? "Syncing..." : "Sync Gmail Now"}
        </Button>
        <Button 
          onClick={() => setShowManualModal(true)} 
          variant="outline"
          className="border-border text-foreground hover:bg-primary/10"
        >
          <MailPlus className="mr-2 h-4 w-4" />
          Add Email Manually
        </Button>
      </div>
      
      {message && <div className="mb-4 text-sm font-medium text-emerald-500 bg-emerald-500/10 p-3 rounded">{message}</div>}

      <Dialog open={showManualModal} onOpenChange={setShowManualModal}>
        <DialogContent className="max-w-xl bg-background border-border">
          <DialogHeader>
            <DialogTitle>Manual Email Entry</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleManualSubmit} className="space-y-4 py-4">
            <p className="text-xs text-muted-foreground">
              Paste the contents of an email from Google here. The AI will parse the ticket ID, link it to the correct review (if ReviewShieldRef is present), and update its status.
            </p>
            <div className="space-y-2">
              <Label htmlFor="campaignId">Select Campaign (Optional)</Label>
              <select 
                id="campaignId"
                name="campaignId"
                className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">-- Let AI / Matcher Find Campaign --</option>
                {campaigns.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.client?.company_name || "Unknown"} - {c.name}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-muted-foreground">If you know who this email belongs to, select their campaign to bypass auto-matching.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject Line</Label>
              <Input id="subject" name="subject" required className="bg-transparent" placeholder="e.g. Re: [Ticket ID: 12345] Removal Request..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bodyData">Email Body</Label>
              <textarea 
                id="bodyData" 
                name="bodyData" 
                required 
                className="flex min-h-[200px] w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 font-mono" 
                placeholder="Paste raw email body here. Include the ReviewShieldRef: uuid tag if it's the initial request."
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setShowManualModal(false)} disabled={processing}>
                Cancel
              </Button>
              <Button type="submit" className="starlight-btn" disabled={processing}>
                {processing ? "Processing AI..." : "Process Email"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
