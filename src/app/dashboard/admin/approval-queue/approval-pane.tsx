"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { approveAndSendDraft, rejectDraft } from "@/app/actions/draft";

interface Draft {
  id: string;
  draft_type: string;
  to_address: string;
  rendered_subject: string;
  rendered_body: string;
  campaign?: { name: string; client?: { company_name: string } } | null;
  email_thread?: { subject: string; raw_body: string; ai_summary?: string | null; ai_confidence?: number | null } | null;
}

export function ApprovalPane({ drafts }: { drafts: Draft[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const currentDraft = drafts[currentIndex];
  
  // Editable state for the right pane
  const [editedSubject, setEditedSubject] = useState(currentDraft?.rendered_subject || "");
  const [editedBody, setEditedBody] = useState(currentDraft?.rendered_body || "");

  // Update local state when index changes
  if (currentDraft && editedSubject === "" && editedBody === "") {
    setEditedSubject(currentDraft.rendered_subject);
    setEditedBody(currentDraft.rendered_body);
  }

  const handleApprove = async () => {
    setLoading(true);
    try {
      await approveAndSendDraft(currentDraft.id, editedSubject, editedBody);
      handleNext();
    } catch (error) {
      console.error(error);
      alert("Failed to approve draft.");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    const note = prompt("Reason for rejection:");
    if (note === null) return;
    
    setLoading(true);
    try {
      await rejectDraft(currentDraft.id, note);
      handleNext();
    } catch (error) {
      console.error(error);
      alert("Failed to reject draft.");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setEditedSubject("");
    setEditedBody("");
    setCurrentIndex(prev => prev + 1);
  };

  if (!currentDraft || currentIndex >= drafts.length) {
    return (
      <div className="vault-card p-12 text-center rounded-md">
        <h3 className="text-xl font-heading font-semibold text-emerald-500 mb-2">Queue Cleared!</h3>
        <p className="text-muted-foreground">You have reviewed all loaded drafts.</p>
        <Button onClick={() => window.location.reload()} className="mt-6 starlight-btn">
          Refresh Queue
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[700px]">
      {/* LEFT PANE: Context & Incoming Email */}
      <div className="vault-card rounded-md flex flex-col overflow-hidden border-border">
        <div className="p-4 border-b border-border bg-card/50 flex justify-between items-center">
          <h2 className="font-heading font-semibold text-foreground">Google Context</h2>
          {currentDraft.email_thread?.ai_confidence && (
            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
              currentDraft.email_thread.ai_confidence > 80 ? "bg-emerald-500/20 text-emerald-500" : "bg-amber-500/20 text-amber-500"
            }`}>
              AI Confidence: {currentDraft.email_thread.ai_confidence}%
            </span>
          )}
        </div>
        <div className="p-6 flex-1 overflow-auto space-y-6">
          
          <div className="bg-primary/5 p-4 rounded-md border border-primary/10">
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-2">Campaign Details</h3>
            <p className="text-sm text-foreground"><span className="text-muted-foreground">Client:</span> {currentDraft.campaign?.client?.company_name}</p>
            <p className="text-sm text-foreground"><span className="text-muted-foreground">Campaign:</span> {currentDraft.campaign?.name}</p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-foreground mb-3 border-b border-border pb-2">Incoming Email from Google</h3>
            {currentDraft.email_thread ? (
              <>
                <p className="text-sm font-medium text-foreground mb-1">Subject: {currentDraft.email_thread.subject}</p>
                <div className="bg-background p-4 rounded-md border border-border text-sm font-mono text-muted-foreground whitespace-pre-wrap">
                  {currentDraft.email_thread.raw_body}
                </div>
                
                <div className="mt-4 bg-muted/50 p-4 rounded-md border border-border">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">AI Summary</p>
                  <p className="text-sm text-foreground">{currentDraft.email_thread.ai_summary}</p>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground italic">No incoming email linked. This is a newly initiated request.</p>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT PANE: Draft Edit & Approve */}
      <div className="vault-card rounded-md flex flex-col overflow-hidden border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.1)]">
        <div className="p-4 border-b border-border bg-card/50 flex justify-between items-center">
          <h2 className="font-heading font-semibold text-foreground">AI Draft Response</h2>
          <span className="px-2 py-1 rounded bg-muted text-muted-foreground text-xs font-semibold uppercase">
            {currentDraft.draft_type}
          </span>
        </div>
        
        <div className="p-6 flex-1 flex flex-col space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">To</label>
            <Input value={currentDraft.to_address} readOnly className="bg-muted/50 border-border text-foreground text-sm h-8" />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Subject</label>
            <Input 
              value={editedSubject || currentDraft.rendered_subject} 
              onChange={(e) => setEditedSubject(e.target.value)}
              className="bg-transparent border-border text-foreground font-medium" 
            />
          </div>

          <div className="space-y-2 flex-1 flex flex-col">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Message Body</label>
            <textarea 
              value={editedBody || currentDraft.rendered_body}
              onChange={(e) => setEditedBody(e.target.value)}
              className="flex-1 w-full rounded-md border border-border bg-transparent p-4 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono resize-none leading-relaxed"
            />
          </div>
        </div>

        <div className="p-4 border-t border-border bg-card/50 flex justify-between items-center">
          <p className="text-xs text-muted-foreground">Draft {currentIndex + 1} of {drafts.length}</p>
          <div className="flex gap-3">
            <Button variant="destructive" onClick={handleReject} disabled={loading} className="w-24">
              Reject
            </Button>
            <Button onClick={handleApprove} disabled={loading} className="w-32 starlight-btn">
              {loading ? "Sending..." : "Approve & Send"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
