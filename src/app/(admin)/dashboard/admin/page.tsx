import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/Auth';
import {
    getDashboardCounts,
    getLowStockItems,
    getRecentMovements,
    getOpnameSummary,
    getMovementSummary,
} from '@/services/reporting/DashboardService';
import { MetricCard } from '@/components/MetricCard';
import { Button } from '@/components/ui/button';
import {
    Package,
    Warehouse,
    AlertTriangle,
    Boxes,
    ArrowRight,
    ShieldAlert,
    PlusCircle,
    Activity,
    Layers,
    FileSpreadsheet,
    ShieldCheck,
    Users,
    TrendingUp,
    Clock,
} from 'lucide-react';

const MOVEMENT_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
    RECEIVE:    { bg: 'bg-emerald-50',  text: 'text-emerald-700', dot: 'bg-emerald-400' },
    ISSUE:      { bg: 'bg-orange-50',   text: 'text-orange-700',  dot: 'bg-orange-400'  },
    TRANSFER:   { bg: 'bg-blue-50',     text: 'text-blue-700',    dot: 'bg-blue-400'    },
    RETURN:     { bg: 'bg-purple-50',   text: 'text-purple-700',  dot: 'bg-purple-400'  },
    ADJUSTMENT: { bg: 'bg-amber-50',    text: 'text-amber-700',   dot: 'bg-amber-400'   },
};

const defaultStyle = { bg: 'bg-slate-50', text: 'text-slate-700', dot: 'bg-slate-400' };

export default async function AdminDashboardPage() {
    const user = await getCurrentUser();
    if (!user) redirect('/login');
    if (user.role !== 'ADMIN') redirect('/');

    const [counts, lowStockItems, recentMovements, opnameSummary, movementSummary] =
        await Promise.all([
            getDashboardCounts(),
            getLowStockItems(5),
            getRecentMovements(6),
            getOpnameSummary(),
            getMovementSummary(),
        ]);

    return (
        <div className="max-w-7xl mx-auto space-y-7">
            {/* ── Page Header ───────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-200">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
                            <ShieldCheck className="h-3 w-3" />
                            Executive Overview
                        </span>
                    </div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900">
                        Admin Control Desk
                    </h1>
                    <p className="text-[14px] text-slate-500">
                        Pusat kendali master data, inventaris global, dan metrik operasional
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Link href="/users">
                        <Button variant="outline" size="sm" className="gap-1.5 border-slate-300">
                            <Users className="h-3.5 w-3.5" />
                            Manajemen User
                        </Button>
                    </Link>
                    <Link href="/items">
                        <Button size="sm" className="gap-1.5">
                            <PlusCircle className="h-3.5 w-3.5" />
                            Tambah Barang
                        </Button>
                    </Link>
                    <Link href="/audit">
                        <Button variant="outline" size="sm" className="gap-1.5 border-slate-300">
                            <ShieldAlert className="h-3.5 w-3.5" />
                            Audit Trail
                        </Button>
                    </Link>
                </div>
            </div>

            {/* ── Metric Cards ──────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                <div className="animate-fade-up stagger-1">
                    <MetricCard
                        title="Total Master Barang"
                        value={counts.activeItems}
                        description="Katalog SKU barang terdaftar"
                        icon={Package}
                        variant="indigo"
                    />
                </div>
                <div className="animate-fade-up stagger-2">
                    <MetricCard
                        title="Infrastruktur Gudang"
                        value={counts.activeWarehouses}
                        description={`${counts.activeLocations} zona rak penyimpanan`}
                        icon={Warehouse}
                        variant="default"
                    />
                </div>
                <div className="animate-fade-up stagger-3">
                    <MetricCard
                        title="Volume Persediaan"
                        value={counts.totalInventoryQty.toLocaleString('id-ID')}
                        description="Total unit stok fisik terverifikasi"
                        icon={Boxes}
                        variant="success"
                    />
                </div>
                <div className="animate-fade-up stagger-4">
                    <MetricCard
                        title="Peringatan Stok Rendah"
                        value={counts.lowStockCount}
                        description="Barang di bawah batas minimum"
                        icon={AlertTriangle}
                        variant={counts.lowStockCount > 0 ? 'danger' : 'success'}
                        badge={counts.lowStockCount > 0 ? 'Perlu Restock' : 'Semua Aman'}
                    />
                </div>
            </div>

            {/* ── Main Content Row ──────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Low Stock Alert */}
                <div className="rounded-2xl bg-white border border-[rgba(15,23,42,0.08)] shadow-[0_1px_2px_rgba(15,23,42,0.04),_0_4px_16px_rgba(15,23,42,0.06)] overflow-hidden animate-fade-up stagger-3">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center">
                                <AlertTriangle className="h-4 w-4 text-rose-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 text-[15px] leading-none">Stok Kritis</h3>
                                <p className="text-[12px] text-slate-400 mt-0.5">Di bawah atau sama dengan batas aman</p>
                            </div>
                        </div>
                        <Link href="/reports/low-stock">
                            <Button variant="ghost" size="sm" className="text-[13px] text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 gap-1">
                                Lihat semua <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                        </Link>
                    </div>

                    <div className="px-6 py-4">
                        {lowStockItems.length === 0 ? (
                            <div className="py-8 text-center">
                                <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-2">
                                    <ShieldCheck className="h-5 w-5 text-emerald-500" />
                                </div>
                                <p className="text-[13px] text-slate-500 font-medium">Semua stok berada pada level aman</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-slate-100">
                                            <th className="pb-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">SKU</th>
                                            <th className="pb-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Barang</th>
                                            <th className="pb-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 text-right">Stok</th>
                                            <th className="pb-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 text-right">Min</th>
                                            <th className="pb-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 text-right">Defisit</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lowStockItems.map((item) => (
                                            <tr key={item.sku} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors">
                                                <td className="py-3 font-mono font-bold text-[13px] text-slate-800">{item.sku}</td>
                                                <td className="py-3 text-[13px] text-slate-700 font-medium">{item.name}</td>
                                                <td className="py-3 text-[13px] font-bold text-rose-600 text-right">{item.totalStock}</td>
                                                <td className="py-3 text-[13px] text-slate-500 text-right">{item.minStock}</td>
                                                <td className="py-3 text-[13px] font-bold text-rose-600 text-right">-{item.deficit}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Movements */}
                <div className="rounded-2xl bg-white border border-[rgba(15,23,42,0.08)] shadow-[0_1px_2px_rgba(15,23,42,0.04),_0_4px_16px_rgba(15,23,42,0.06)] overflow-hidden animate-fade-up stagger-4">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                                <Activity className="h-4 w-4 text-blue-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 text-[15px] leading-none">Mutasi Terakhir</h3>
                                <p className="text-[12px] text-slate-400 mt-0.5">Ledger pergerakan inventaris</p>
                            </div>
                        </div>
                        <Link href="/reports/movements">
                            <Button variant="ghost" size="sm" className="text-[13px] text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 gap-1">
                                Semua <ArrowRight className="h-3.5 w-3.5" />
                            </Button>
                        </Link>
                    </div>

                    <div className="px-6 py-4 space-y-2">
                        {recentMovements.length === 0 ? (
                            <p className="text-[13px] text-slate-400 py-8 text-center">Belum ada pergerakan stok tercatat.</p>
                        ) : (
                            recentMovements.map((m) => {
                                const style = MOVEMENT_STYLES[m.type] ?? defaultStyle;
                                return (
                                    <div
                                        key={m._id}
                                        className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded-lg ${style.bg} ${style.text}`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                                                {m.type}
                                            </span>
                                            <div>
                                                <p className="text-[13px] font-bold text-slate-800 font-mono leading-none">{m.sku}</p>
                                                <p className="text-[11px] text-slate-400 mt-0.5">{m.movementNumber} • {m.actorName}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[14px] font-black text-slate-900 leading-none">
                                                {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                                            </p>
                                            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center justify-end gap-1">
                                                <Clock className="h-3 w-3" />
                                                {new Date(m.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* ── Analytics Row ─────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Movement Distribution */}
                <div className="rounded-2xl bg-white border border-[rgba(15,23,42,0.08)] shadow-[0_1px_2px_rgba(15,23,42,0.04),_0_4px_16px_rgba(15,23,42,0.06)] p-5 animate-fade-up stagger-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Layers className="h-4 w-4 text-indigo-500" />
                        <h4 className="text-[12px] font-bold uppercase tracking-wider text-slate-500">
                            Sebaran Mutasi
                        </h4>
                    </div>
                    <div className="space-y-2.5">
                        {movementSummary.length === 0 ? (
                            <p className="text-[13px] text-slate-400 py-4 text-center">Belum ada data</p>
                        ) : (
                            movementSummary.map((ms) => {
                                const style = MOVEMENT_STYLES[ms.type] ?? defaultStyle;
                                return (
                                    <div key={ms.type} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                                        <div className="flex items-center gap-2">
                                            <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                                            <span className="text-[13px] text-slate-700 font-semibold">{ms.type}</span>
                                        </div>
                                        <div className="flex items-center gap-2.5">
                                            <span className="text-[12px] text-slate-400">{ms.count}×</span>
                                            <span className="text-[13px] font-bold text-slate-900">{ms.totalQuantity} unit</span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Opname Summary */}
                <div className="rounded-2xl bg-white border border-[rgba(15,23,42,0.08)] shadow-[0_1px_2px_rgba(15,23,42,0.04),_0_4px_16px_rgba(15,23,42,0.06)] p-5 animate-fade-up stagger-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <FileSpreadsheet className="h-4 w-4 text-teal-500" />
                            <h4 className="text-[12px] font-bold uppercase tracking-wider text-slate-500">
                                Dokumen Opname
                            </h4>
                        </div>
                        <Link href="/reports/opnames">
                            <Button variant="ghost" size="sm" className="h-6 text-[11px] text-indigo-600 px-1.5">
                                Rekap
                            </Button>
                        </Link>
                    </div>
                    <div className="space-y-2">
                        {opnameSummary.length === 0 ? (
                            <p className="text-[13px] text-slate-400 py-4 text-center">Belum ada dokumen opname</p>
                        ) : (
                            opnameSummary.map((os) => (
                                <div key={os.status} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                                    <span className="text-[13px] text-slate-700 font-medium">{os.status}</span>
                                    <span className="text-[12px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                        {os.count}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Fast Access */}
                <div className="rounded-2xl bg-white border border-[rgba(15,23,42,0.08)] shadow-[0_1px_2px_rgba(15,23,42,0.04),_0_4px_16px_rgba(15,23,42,0.06)] p-5 animate-fade-up stagger-6">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="h-4 w-4 text-indigo-500" />
                        <h4 className="text-[12px] font-bold uppercase tracking-wider text-slate-500">
                            Akses Cepat
                        </h4>
                    </div>
                    <div className="space-y-1">
                        {[
                            { href: '/items', label: 'Katalog Barang & SKU', icon: Package },
                            { href: '/warehouses', label: 'Gudang & Fasilitas', icon: Warehouse },
                            { href: '/locations', label: 'Zona Rak & Lokasi', icon: Layers },
                            { href: '/users', label: 'Manajemen Pengguna', icon: Users },
                        ].map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                            >
                                <div className="flex items-center gap-2.5">
                                    <link.icon className="h-4 w-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                    <span className="text-[13px] font-medium text-slate-700 group-hover:text-slate-900">{link.label}</span>
                                </div>
                                <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
