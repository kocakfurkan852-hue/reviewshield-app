import { getPendingDrafts } from "@/app/actions/draft";
import { ApprovalPane } from "./approval-pane";

export default async function ApprovalQueuePage() {
  const pendingDrafts = await getPendingDrafts();

  return (
    <div className="p-8 bg-background min-h-screen flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-foreground flex items-center gap-3">
          Approval Queue
          <span className="bg-amber-500 text-black text-sm font-bold px-3 py-1 rounded-full">
            {pendingDrafts.length}
          </span>
        </h1>
        <p className="text-muted-foreground mt-1">Review and approve AI-generated email responses to Google.</p>
      </div>

      <div className="flex-1">
        {pendingDrafts.length === 0 ? (
          <div className="vault-card p-12 text-center rounded-md">
            <h3 className="text-xl font-heading font-semibold text-foreground mb-2">You&apos;re all caught up!</h3>
            <p className="text-muted-foreground">There are no pending drafts waiting for your approval.</p>
          </div>
        ) : (
          <ApprovalPane drafts={pendingDrafts} />
        )}
      </div>
    </div>
  );
}
