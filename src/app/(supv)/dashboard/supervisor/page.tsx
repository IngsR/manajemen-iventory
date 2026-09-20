import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/Auth';
import {
    getDashboardCounts,
    getLowStockItems,
    getRecentMovements,
    getOpnameSummary,
} from '@/services/reporting/DashboardService';
import { getOpnameReport } from '@/services/reporting/InventoryReportService';
import { MetricCard } from '@/components/MetricCard';
import { Button } from '@/components/ui/button';
import {
    Boxes,
    AlertTriangle,
    ClipboardCheck,
    Clock,
    ArrowRight,
    CheckCircle2,
    Activity,
    ShieldAlert,
    Eye,
} from 'lucide-react';

export default async function SupervisorDashboardPage() {
    const user = await getCurrentUser();
    if (!user) {
        redirect('/login');
    }
    if (user.role !== 'SUPERVISOR' && user.role !== 'ADMIN') {
        redirect('/');
    }

    const [counts, lowStockItems, recentMovements, opnameSummary, pendingApprovals] =
        await Promise.all([
            getDashboardCounts(),
            getLowStockItems(5),
            getRecentMovements(6),
            getOpnameSummary(),
            getOpnameReport({ status: 'SUBMITTED' }, 1, 5),
        ]);

    const submittedOpnameCount =
        opnameSummary.find((s) => s.status === 'SUBMITTED')?.count ?? 0;

    return (
        <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
            {/* Supervisor Hero Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/60">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            Verification & Oversight
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                        Supervisor Oversight Desk
                    </h1>
                    <p className="text-sm text-slate-500">
                        Pusat verifikasi stok fisik, pengawasan barang kritis, dan otorisasi persetujuan stock opname
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/inventory/stock-opname">
                        <Button size="sm" className="gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-sm">
                            <ClipboardCheck className="h-4 w-4" />
                            Antrean Approval
                        </Button>
                    </Link>
                    <Link href="/audit">
                        <Button size="sm" variant="outline" className="gap-1.5 rounded-xl border-slate-200/80 bg-white/80 hover:bg-slate-100">
                            <ShieldAlert className="h-4 w-4 text-slate-600" />
                            Audit Log
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Apple Silicon Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <MetricCard
                    title="Antrean Approval Opname"
                    value={submittedOpnameCount}
                    description="Dokumen menunggu keputusan Supervisor"
                    icon={Clock}
                    variant={submittedOpnameCount > 0 ? 'warning' : 'default'}
                    badge={submittedOpnameCount > 0 ? 'Perlu Review' : 'Selesai'}
                />
                <MetricCard
                    title="Stok Fisik Total"
                    value={counts.totalInventoryQty.toLocaleString()}
                    description="Total unit tercatat di sistem"
                    icon={Boxes}
                    variant="default"
                />
                <MetricCard
                    title="Stok Di Bawah Minimum"
                    value={counts.lowStockCount}
                    description="Item perlu reorder atau investigasi"
                    icon={AlertTriangle}
                    variant={counts.lowStockCount > 0 ? 'danger' : 'default'}
                />
                <MetricCard
                    title="Entitas Terdaftar"
                    value={counts.activeItems}
                    description={`${counts.activeWarehouses} fasilitas gudang aktif`}
                    icon={CheckCircle2}
                    variant="success"
                />
            </div>

            {/* Priority Approval Queue Glass Card with Amber Border */}
            <div className="glass-card rounded-2xl p-6 border-amber-200/70 relative overflow-hidden bg-gradient-to-r from-amber-50/40 via-white/80 to-white/90">
                <div className="flex items-center justify-between pb-4 mb-2 border-b border-amber-100">
                    <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
                            <h3 className="font-bold text-slate-900 text-base tracking-tight">
                                Antrean Dokumen Menunggu Persetujuan (SUBMITTED)
                            </h3>
                        </div>
                        <p className="text-xs text-slate-500">
                            Hasil hitung fisik oleh Petugas lapangan yang memerlukan verifikasi dan persetujuan Supervisor
                        </p>
                    </div>
                    <Link href="/inventory/stock-opname">
                        <Button variant="ghost" size="sm" className="text-xs text-amber-700 hover:text-amber-800 hover:bg-amber-100/60 rounded-xl">
                            Semua Dokumen <ArrowRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                    </Link>
                </div>

                {pendingApprovals.data.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs">
                        🎉 Tidak ada dokumen opname yang menunggu approval saat ini.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-amber-200/40 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                                    <th className="pb-2.5">Nomor Opname</th>
                                    <th className="pb-2.5">Dibuat Oleh</th>
                                    <th className="pb-2.5">Waktu Submit</th>
                                    <th className="pb-2.5 text-center">Jumlah Item</th>
                                    <th className="pb-2.5 text-right">Keputusan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-amber-100/80">
                                {pendingApprovals.data.map((op) => (
                                    <tr key={op._id} className="hover:bg-amber-50/40 transition-colors">
                                        <td className="py-3 font-mono font-bold text-slate-800">
                                            {op.opnameNumber}
                                        </td>
                                        <td className="py-3 text-slate-700 font-medium">{op.createdByName}</td>
                                        <td className="py-3 text-slate-500">
                                            {op.submittedAt
                                                ? new Date(op.submittedAt).toLocaleDateString('id-ID', {
                                                      day: '2-digit',
                                                      month: 'short',
                                                      year: 'numeric',
                                                      hour: '2-digit',
                                                      minute: '2-digit',
                                                  })
                                                : '-'}
                                        </td>
                                        <td className="py-3 text-center font-bold text-slate-800">
                                            {op.itemCount}
                                        </td>
                                        <td className="py-3 text-right">
                                            <Link href="/inventory/stock-opname">
                                                <Button size="sm" className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm">
                                                    Review & Putuskan
                                                </Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Row 2: Low Stock & Ledger Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Low Stock Monitor */}
                <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
                    <div className="flex items-center justify-between pb-4 mb-2 border-b border-slate-100">
                        <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-rose-500" />
                                <h3 className="font-bold text-slate-900 text-base tracking-tight">
                                    Pengawasan Stok Rendah
                                </h3>
                            </div>
                            <p className="text-xs text-slate-500">Item persediaan yang mengalami defisit</p>
                        </div>
                        <Link href="/reports/low-stock">
                            <Button variant="ghost" size="sm" className="text-xs text-amber-700 hover:text-amber-800 hover:bg-amber-50 rounded-xl">
                                Selengkapnya <ArrowRight className="h-3.5 w-3.5 ml-1" />
                            </Button>
                        </Link>
                    </div>

                    {lowStockItems.length === 0 ? (
                        <p className="text-xs text-slate-400 py-8 text-center">
                            Seluruh barang berada pada tingkat persediaan aman.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {lowStockItems.map((item) => (
                                <div
                                    key={item.sku}
                                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-white/60 hover:bg-slate-50 transition-colors text-xs"
                                >
                                    <div>
                                        <span className="font-mono font-bold text-slate-800">{item.sku}</span>
                                        <p className="text-slate-600 mt-0.5">{item.name}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-bold text-rose-600 block">
                                            Sisa: {item.totalStock} / Min: {item.minStock}
                                        </span>
                                        <span className="text-[10px] text-slate-400">Defisit {item.deficit} unit</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Ledger Activity Stream */}
                <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
                    <div className="flex items-center justify-between pb-4 mb-2 border-b border-slate-100">
                        <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                                <Activity className="h-4 w-4 text-blue-500" />
                                <h3 className="font-bold text-slate-900 text-base tracking-tight">
                                    Aktivitas Mutasi Terkini
                                </h3>
                            </div>
                            <p className="text-xs text-slate-500">Jejak mutasi gudang yang diverifikasi</p>
                        </div>
                        <Link href="/reports/movements">
                            <Button variant="ghost" size="sm" className="text-xs text-amber-700 hover:text-amber-800 hover:bg-amber-50 rounded-xl">
                                Laporan Mutasi <ArrowRight className="h-3.5 w-3.5 ml-1" />
                            </Button>
                        </Link>
                    </div>

                    {recentMovements.length === 0 ? (
                        <p className="text-xs text-slate-400 py-8 text-center">
                            Belum ada pergerakan stok tercatat.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {recentMovements.map((m) => (
                                <div
                                    key={m._id}
                                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-white/60 hover:bg-slate-50 transition-colors text-xs"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                                            {m.type}
                                        </span>
                                        <span className="font-mono font-bold text-slate-800">{m.sku}</span>
                                        <span className="text-slate-400 text-[11px]">• {m.actorName}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-bold text-slate-900">
                                            {m.quantity > 0 ? `+${m.quantity}` : m.quantity} unit
                                        </span>
                                        <span className="text-slate-400 block text-[10px]">
                                            {new Date(m.timestamp).toLocaleTimeString('id-ID', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
