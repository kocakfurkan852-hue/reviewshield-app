"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteClient } from "@/app/actions/client";
import { useRouter } from "next/navigation";

export function DeleteClientButton({ id, name }: { id: string, name: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete client "${name}"? This will also delete all associated campaigns and reviews.`)) {
      return;
    }

    setLoading(true);
    try {
      const result = await deleteClient(id);
      if (result.success) {
        router.refresh();
      }
    } catch (e: any) {
      alert(e.message || "Failed to delete client");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={handleDelete} 
      disabled={loading}
      className="text-destructive hover:text-destructive hover:bg-destructive/10"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
