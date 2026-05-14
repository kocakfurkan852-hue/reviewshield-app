"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { changePassword } from "@/app/actions/password";

export function PasswordForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const result = await changePassword(formData);
      if (result.success) {
        setSuccess(true);
        // Reset form
        const form = document.getElementById("password-form") as HTMLFormElement;
        form?.reset();
      }
    } catch (e: any) {
      setError(e.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form id="password-form" action={handleSubmit} className="space-y-4 max-w-sm">
      <div className="space-y-2">
        <label className="text-sm text-foreground">New Password</label>
        <Input type="password" name="newPassword" required className="bg-background/20 border-border" minLength={6} />
      </div>
      <div className="space-y-2">
        <label className="text-sm text-foreground">Confirm Password</label>
        <Input type="password" name="confirmPassword" required className="bg-background/20 border-border" minLength={6} />
      </div>
      
      {error && <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">{error}</p>}
      {success && <p className="text-sm text-emerald-500 bg-emerald-500/10 p-2 rounded">Password updated successfully!</p>}
      
      <Button type="submit" disabled={loading} className="starlight-btn w-full">
        {loading ? "Updating..." : "Update Password"}
      </Button>
      <p className="text-[10px] text-muted-foreground text-center">Your password must be at least 6 characters long.</p>
    </form>
  );
}
