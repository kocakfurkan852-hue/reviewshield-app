"use client";

import { useState } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { assignEmailToCampaign, deleteEmailThread } from "@/app/actions/email";
import { Mail, ArrowRight, Trash2, Info } from "lucide-react";
import { Label } from "@/components/ui/label";

interface OrphanEmail {
  id: string;
  subject: string;
  received_at: Date;
  raw_body: string;
  ai_summary: string | null;
  ai_confidence: number | null;
}

interface Client {
  id: string;
  company_name: string;
  campaigns: {
    id: string;
    name: string;
    reviews: {
      id: string;
      reviewer_name: string | null;
      star_rating: number;
    }[];
  }[];
}

export function OrphanInboxView({ initialOrphans, clients }: { initialOrphans: OrphanEmail[], clients: Client[] }) {
  const [orphans, setOrphans] = useState(initialOrphans);
  const [selectedEmail, setSelectedEmail] = useState<OrphanEmail | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [selectedReviewId, setSelectedReviewId] = useState<string>("");

  const activeClient = clients.find(c => c.id === selectedClientId);
  const activeCampaign = activeClient?.campaigns.find(camp => camp.id === selectedCampaignId);

  const handleAssign = async () => {
    if (!selectedEmail || !selectedCampaignId) return;
    
    setLoading(true);
    try {
      await assignEmailToCampaign(selectedEmail.id, selectedCampaignId, selectedReviewId);
      setOrphans(prev => prev.filter(o => o.id !== selectedEmail.id));
      setSelectedEmail(null);
      resetSelection();
    } catch (error) {
      console.error(error);
      alert("Failed to assign email.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this email?")) return;
    
    try {
      await deleteEmailThread(id);
      setOrphans(prev => prev.filter(o => o.id !== id));
    } catch (error) {
      alert("Failed to delete.");
    }
  };

  const resetSelection = () => {
    setSelectedClientId("");
    setSelectedCampaignId("");
    setSelectedReviewId("");
  };

  if (orphans.length === 0) {
    return (
      <div className="vault-card p-12 text-center rounded-md border border-border">
        <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
        <h3 className="text-xl font-heading font-semibold text-foreground mb-2">Inbox Empty</h3>
        <p className="text-muted-foreground">All incoming Google correspondence is currently matched to campaigns.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="vault-card rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Received</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>AI Analysis</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orphans.map((email) => (
              <TableRow key={email.id} className="group">
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {format(new Date(email.received_at), "dd. MMM, HH:mm", { locale: de })}
                </TableCell>
                <TableCell className="font-medium text-foreground max-w-md truncate">
                  {email.subject}
                </TableCell>
                <TableCell>
                  {email.ai_summary && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground line-clamp-1">{email.ai_summary}</span>
                      {email.ai_confidence && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                          email.ai_confidence > 80 ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                        }`}>
                          {email.ai_confidence}%
                        </span>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDelete(email.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      className="starlight-btn h-8"
                      size="sm" 
                      onClick={() => setSelectedEmail(email)}
                    >
                      Assign <ArrowRight className="ml-2 h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedEmail} onOpenChange={(open) => !open && setSelectedEmail(null)}>
        <DialogContent className="vault-card border-primary/20 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading font-bold text-foreground">Manual Assignment</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Link this email to an existing campaign so ReviewShield can track the progress and generate a response.
            </DialogDescription>
          </DialogHeader>

          {selectedEmail && (
            <div className="space-y-6 py-4">
              <div className="bg-muted/50 p-4 rounded-md border border-border">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Incoming Email Context</p>
                <h4 className="text-sm font-semibold text-foreground mb-2">{selectedEmail.subject}</h4>
                <div className="text-[11px] text-muted-foreground line-clamp-3 font-mono leading-relaxed bg-background/50 p-2 rounded border border-border/50">
                  {selectedEmail.raw_body}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>1. Select Client</Label>
                  <Select value={selectedClientId} onValueChange={(val) => { setSelectedClientId(val); setSelectedCampaignId(""); setSelectedReviewId(""); }}>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Choose client..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>2. Select Campaign</Label>
                  <Select 
                    value={selectedCampaignId} 
                    onValueChange={(val) => { setSelectedCampaignId(val); setSelectedReviewId(""); }}
                    disabled={!selectedClientId}
                  >
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Choose campaign..." />
                    </SelectTrigger>
                    <SelectContent>
                      {activeClient?.campaigns.map(camp => <SelectItem key={camp.id} value={camp.id}>{camp.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex justify-between">
                  <span>3. Link to Review (Optional)</span>
                  <span className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                    <Info className="h-3 w-3" /> Required if Ticket ID is new
                  </span>
                </Label>
                <Select 
                  value={selectedReviewId} 
                  onValueChange={setSelectedReviewId}
                  disabled={!selectedCampaignId}
                >
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder="Choose review..." />
                  </SelectTrigger>
                  <SelectContent>
                    {activeCampaign?.reviews.map(rev => (
                      <SelectItem key={rev.id} value={rev.id}>
                        {rev.reviewer_name || "Anonymous"} ({rev.star_rating} ★)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setSelectedEmail(null)}>Cancel</Button>
            <Button 
              className="starlight-btn px-8" 
              onClick={handleAssign} 
              disabled={loading || !selectedCampaignId}
            >
              {loading ? "Assigning..." : "Complete Assignment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
