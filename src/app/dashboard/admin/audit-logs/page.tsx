import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return null;

  const page = Number(searchParams.page) || 1;
  const pageSize = 20;

  const logs = await prisma.auditLog.findMany({
    skip: (page - 1) * pageSize,
    take: pageSize,
    orderBy: { created_at: 'desc' },
    include: {
      user: { select: { name: true, email: true } }
    }
  });

  const totalLogs = await prisma.auditLog.count();
  const totalPages = Math.ceil(totalLogs / pageSize);

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-heading font-bold text-foreground mb-2">System Audit Logs</h1>
        <p className="text-muted-foreground mb-8">Comprehensive tracking of all system actions and data modifications.</p>

        <div className="vault-card rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-card/50">
                <TableHead className="w-48">Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Metadata</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No audit logs recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} className="text-sm">
                    <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {log.user ? (
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{log.user.name}</span>
                          <span className="text-xs text-muted-foreground">{log.user.email}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">System / API</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded bg-primary/10 text-primary text-xs font-bold font-mono">
                        {log.action}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {log.entity_type} <br />
                      <span className="text-[10px] opacity-70">{log.entity_id}</span>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate font-mono text-xs">
                      {log.metadata || "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-border flex justify-between items-center bg-card/30">
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <div className="space-x-2">
                <a 
                  href={`?page=${page - 1}`} 
                  className={`px-3 py-1 rounded text-sm ${page <= 1 ? 'pointer-events-none opacity-50 bg-muted text-muted-foreground' : 'bg-primary/20 text-primary hover:bg-primary/30'}`}
                >
                  Previous
                </a>
                <a 
                  href={`?page=${page + 1}`} 
                  className={`px-3 py-1 rounded text-sm ${page >= totalPages ? 'pointer-events-none opacity-50 bg-muted text-muted-foreground' : 'bg-primary/20 text-primary hover:bg-primary/30'}`}
                >
                  Next
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
