import { getUsers } from "@/app/actions/user";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserEditModal } from "@/components/user-edit-modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage your agents and administrators.</p>
        </div>
        <Link href="/dashboard/admin/users/new">
          <Button className="starlight-btn">+ Add User</Button>
        </Link>
      </div>

      <div className="vault-card rounded-md">
        <Table>
          <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Rights</TableHead>
                <TableHead>Added On</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium text-foreground">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${user.role === 'ADMIN' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {user.permissions?.slice(0, 2).map((p: string) => (
                          <span key={p} className="text-[10px] bg-card border border-border px-1.5 py-0.5 rounded text-muted-foreground">
                            {p.replace('_', ' ')}
                          </span>
                        ))}
                        {user.permissions?.length > 2 && (
                          <span className="text-[10px] text-muted-foreground font-medium">
                            +{user.permissions.length - 2} more
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <UserEditModal user={user} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
        </Table>
      </div>
    </div>
  );
}
