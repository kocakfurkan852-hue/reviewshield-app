import { KnowledgeForm } from "./knowledge-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NewKnowledgePage() {
  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard/admin/knowledge">
            <Button variant="ghost" className="mb-4 pl-0 text-muted-foreground hover:text-foreground">
              ← Back to Knowledge Base
            </Button>
          </Link>
          <h1 className="text-3xl font-heading font-bold text-foreground">Add Knowledge Entry</h1>
          <p className="text-muted-foreground mt-1">Provide AI with context on legal arguments and policies.</p>
        </div>
        
        <div className="vault-card p-6">
          <KnowledgeForm />
        </div>
      </div>
    </div>
  );
}
