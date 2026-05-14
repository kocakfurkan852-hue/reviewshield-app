import { ClientForm } from "./client-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NewClientPage() {
  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard/admin/clients">
            <Button variant="ghost" className="mb-4 pl-0 text-muted-foreground hover:text-foreground">
              ← Back to Clients
            </Button>
          </Link>
          <h1 className="text-3xl font-heading font-bold text-foreground">Add New Client</h1>
          <p className="text-muted-foreground mt-1">Create a new client profile to begin managing their reputation campaigns.</p>
        </div>
        
        <div className="vault-card p-6">
          <ClientForm />
        </div>
      </div>
    </div>
  );
}
