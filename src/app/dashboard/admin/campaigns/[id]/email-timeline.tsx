"use client";

import { useState } from "react";

interface EmailEntry {
  id: string;
  subject: string;
  direction: "INBOUND" | "OUTBOUND";
  ai_parsed_action: string | null;
  ai_summary: string | null;
  ai_confidence: number | null;
  google_response_type: string | null;
  processed: boolean;
  received_at: string;
  raw_body: string;
  gmail_thread_id: string;
}

const actionColors: Record<string, string> = {
  APPROVED: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  REJECTED: "bg-red-500/20 text-red-400 border-red-500/30",
  NEEDS_INFO: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  UNKNOWN: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

const directionStyles: Record<string, { bg: string; icon: string; label: string }> = {
  INBOUND: { bg: "bg-blue-500/10 border-l-blue-500", icon: "📥", label: "Received" },
  OUTBOUND: { bg: "bg-violet-500/10 border-l-violet-500", icon: "📤", label: "Sent" },
};

export function EmailTimeline({ emails }: { emails: EmailEntry[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (emails.length === 0) {
    return (
      <div className="vault-card p-8 rounded-md text-center">
        <div className="text-3xl mb-3">📭</div>
        <h3 className="text-lg font-heading font-semibold text-foreground mb-1">
          No Email Activity
        </h3>
        <p className="text-sm text-muted-foreground">
          Emails from Google will appear here once they are processed via Zapier or the Gmail scanner.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {emails.map((email) => {
        const dir = directionStyles[email.direction] || directionStyles.INBOUND;
        const actionColor = email.ai_parsed_action
          ? actionColors[email.ai_parsed_action] || actionColors.UNKNOWN
          : "";
        const isExpanded = expandedId === email.id;

        return (
          <div
            key={email.id}
            className={`vault-card rounded-md border-l-4 ${dir.bg} ${dir.bg.includes("blue") ? "border-l-blue-500" : "border-l-violet-500"} transition-all duration-200`}
          >
            <button
              onClick={() => setExpandedId(isExpanded ? null : email.id)}
              className="w-full p-4 text-left"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-lg">{dir.icon}</span>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {dir.label}
                    </span>
                    {email.ai_parsed_action && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${actionColor}`}
                      >
                        {email.ai_parsed_action}
                      </span>
                    )}
                    {email.ai_confidence !== null && email.ai_confidence > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {email.ai_confidence}% confidence
                      </span>
                    )}
                    {!email.processed && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
                        Processing…
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-foreground truncate">
                    {email.subject}
                  </h4>
                  {email.ai_summary && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {email.ai_summary}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground">
                    {new Date(email.received_at).toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(email.received_at).toLocaleTimeString("de-DE", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {isExpanded ? "▲" : "▼"}
                  </span>
                </div>
              </div>
            </button>

            {isExpanded && (
              <div className="px-4 pb-4 border-t border-border/50 pt-3 space-y-3">
                {email.google_response_type && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Response Type:
                    </span>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded font-mono">
                      {email.google_response_type}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-xs font-medium text-muted-foreground block mb-1">
                    Raw Email Body:
                  </span>
                  <pre className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap font-mono">
                    {email.raw_body}
                  </pre>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
