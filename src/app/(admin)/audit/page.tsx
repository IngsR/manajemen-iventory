import { DataTable } from "@/components/shared/DataTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requirePagePermission } from "@/lib/Auth";
import { getRecentAuditLogs } from "@/services/AuditLogService";
import { Activity, Clock, ShieldAlert, User } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  // Server-side authorization boundary: only ADMIN/SUPERVISOR hold AUDIT_VIEW.
  // Unauthorized roles are redirected server-side and never reach the render.
  await requirePagePermission("AUDIT_VIEW");

  const logs = await getRecentAuditLogs(100);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "border-indigo-200 bg-indigo-50 text-indigo-700";
      case "SUPERVISOR":
        return "border-amber-200 bg-amber-50 text-amber-700";
      case "PETUGAS":
        return "border-emerald-200 bg-emerald-50 text-emerald-700";
      default:
        return "border-slate-200 bg-slate-50 text-slate-700";
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      <PageHeader
        title="Sistem Audit Trail & Riwayat Operasi"
        subtitle="Catatan riwayat tindakan pengguna sistem yang bersifat append-only dan immutable untuk akuntabilitas."
        icon={ShieldAlert}
        badge={{ label: "GOVERNANCE & AUDIT", variant: "admin" }}
        breadcrumbs={[
          { label: "StockFlow", href: "/" },
          { label: "Audit & Analitik" },
          { label: "Audit Trail" },
        ]}
      />

      <DataTable
        title="Catatan Audit Sistem (100 Aktivitas Terakhir)"
        description="Semua mutasi, login, konfigurasi data, dan opname dicatat secara otomatis."
        badgeCount={logs.length}
        dataLength={logs.length}
        emptyTitle="Belum Ada Log Audit"
        emptyDescription="Belum ada aktivitas transaksi atau tata kelola yang terekam."
        emptyIcon={ShieldAlert}
      >
        <Table>
          <TableHeader className="bg-slate-50/75">
            <TableRow>
              <TableHead className="w-[170px] text-xs font-bold text-slate-700">
                WAKTU (WIB)
              </TableHead>
              <TableHead className="w-[180px] text-xs font-bold text-slate-700">
                PENGGUNA
              </TableHead>
              <TableHead className="w-[130px] text-xs font-bold text-slate-700">
                ROLE
              </TableHead>
              <TableHead className="w-[140px] text-xs font-bold text-slate-700">
                TINDAKAN
              </TableHead>
              <TableHead className="w-[140px] text-xs font-bold text-slate-700">
                RESOURCE
              </TableHead>
              <TableHead className="text-xs font-bold text-slate-700">
                DETAIL LOG
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow
                key={log._id.toHexString()}
                className="hover:bg-slate-50/50 transition-colors"
              >
                <TableCell className="text-xs font-mono text-slate-500 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-slate-400" />
                    <span>
                      {new Date(log.timestamp).toLocaleString("id-ID")}
                    </span>
                  </div>
                </TableCell>

                <TableCell className="text-xs font-semibold text-slate-900">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3 w-3 text-slate-400" />
                    <span>{log.actorName}</span>
                  </div>
                </TableCell>

                <TableCell>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-bold uppercase tracking-wider ${getRoleBadge(log.actorRole)}`}
                  >
                    {log.actorRole}
                  </Badge>
                </TableCell>

                <TableCell>
                  <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-slate-800">
                    <Activity className="h-3 w-3 text-indigo-500" />
                    {log.action}
                  </span>
                </TableCell>

                <TableCell>
                  <div className="space-y-0.5">
                    <div className="text-xs font-medium text-slate-700">
                      {log.resource}
                    </div>
                    {log.resourceId && (
                      <div className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]">
                        {log.resourceId}
                      </div>
                    )}
                  </div>
                </TableCell>

                <TableCell className="max-w-md">
                  {log.details ? (
                    <pre className="text-[11px] font-mono bg-slate-900 text-slate-100 p-2 rounded-lg overflow-x-auto max-h-24 whitespace-pre-wrap leading-tight shadow-inner">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  ) : (
                    <span className="text-xs text-slate-400">-</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DataTable>
    </div>
  );
}
