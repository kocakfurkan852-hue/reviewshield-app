import { TemplateForm } from "./template-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NewTemplatePage() {
  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard/admin/templates">
            <Button variant="ghost" className="mb-4 pl-0 text-muted-foreground hover:text-foreground">
              ← Back to Library
            </Button>
          </Link>
          <h1 className="text-3xl font-heading font-bold text-foreground">Create Response Template</h1>
          <p className="text-muted-foreground mt-1">Design an email template with placeholders like {'{{reviewer_name}}'}.</p>
        </div>
        
        <div className="vault-card p-6">
          <TemplateForm />
        </div>
      </div>
    </div>
  );
}
