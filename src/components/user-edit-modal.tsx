"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { updateUser, deleteUser } from "@/app/actions/user";
import { useRouter } from "next/navigation";
import { Edit2, Trash2, Key } from "lucide-react";

const AVAILABLE_PERMISSIONS = [
  { id: "view_dashboard", label: "View Dashboard" },
  { id: "manage_reviews", label: "Manage Reviews" },
  { id: "import_reviews", label: "Import Reviews" },
  { id: "submit_requests", label: "Submit Removal Requests" },
  { id: "generate_reports", label: "Generate Reports" },
  { id: "manage_clients", label: "Manage Clients" },
  { id: "manage_users", label: "Manage Users" },
];

export function UserEditModal({ user }: { user: any }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedPerms, setSelectedPerms] = useState<string[]>(user.permissions || []);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data: any = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      role: formData.get("role") as "AGENT" | "ADMIN",
      permissions: selectedPerms,
    };

    const newPassword = formData.get("password") as string;
    if (newPassword) {
      data.password = newPassword;
    }

    try {
      await updateUser(user.id, data);
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError((err as any).message || "An error occurred");
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete user ${user.name}?`)) return;
    
    setLoading(true);
    try {
      await deleteUser(user.id);
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError((err as any).message || "An error occurred");
      setLoading(false);
    }
  }

  const togglePermission = (id: string) => {
    setSelectedPerms(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          <Edit2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-background border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User: {user.name}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={onSubmit} className="space-y-6 py-4">
          {error && <div className="text-destructive bg-destructive/10 p-3 rounded text-sm">{error}</div>}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" defaultValue={user.name} required className="bg-transparent" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={user.email} required className="bg-transparent" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select 
                id="role" 
                name="role" 
                defaultValue={user.role}
                className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="AGENT">AGENT</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Reset Password (leave blank to keep current)</Label>
              <div className="relative">
                <Input id="password" name="password" type="password" placeholder="New password..." className="bg-transparent pr-10" />
                <Key className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label>User Rights / Permissions</Label>
            <div className="grid grid-cols-2 gap-2 p-4 border border-border rounded-md bg-card/30">
              {AVAILABLE_PERMISSIONS.map(perm => (
                <label key={perm.id} className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-white/5 rounded-md transition-colors">
                  <input 
                    type="checkbox" 
                    checked={selectedPerms.includes(perm.id)}
                    onChange={() => togglePermission(perm.id)}
                    className="w-4 h-4 rounded border-border bg-background accent-primary"
                  />
                  <span className="text-sm text-foreground">{perm.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-border">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={handleDelete}
              className="text-destructive hover:bg-destructive/10"
              disabled={loading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete User
            </Button>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" className="starlight-btn" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
