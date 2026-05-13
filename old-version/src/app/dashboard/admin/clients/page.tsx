import { getClients } from "@/app/actions/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function ClientsPage() {
  const clients = await getClients();

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Clients</h1>
          <p className="text-muted-foreground mt-1">Manage your active clients and their campaigns.</p>
        </div>
        <Link href="/dashboard/admin/clients/new">
          <Button className="starlight-btn">+ Add Client</Button>
        </Link>
      </div>

      <div className="vault-card rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company Name</TableHead>
              <TableHead>Contact Person</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Campaigns</TableHead>
              <TableHead>Added On</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No clients found. Click &quot;Add Client&quot; to create one.
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium text-foreground">{client.company_name}</TableCell>
                  <TableCell>{client.contact_name}</TableCell>
                  <TableCell>{client.contact_email}</TableCell>
                  <TableCell>{client._count.campaigns}</TableCell>
                  <TableCell>{new Date(client.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/dashboard/admin/clients/${client.id}`}>
                      <Button variant="outline" size="sm" className="mr-2 border-border text-foreground">View</Button>
                    </Link>
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
