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
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';

export default async function AdminDashboardPage() {
    const user = await getCurrentUser();
    if (!user) {
        redirect('/login');
    }
    if (user.role !== 'ADMIN') {
        redirect('/');
    }

    const [counts, lowStockItems, recentMovements, opnameSummary, movementSummary] =
        await Promise.all([
            getDashboardCounts(),
            getLowStockItems(5),
            getRecentMovements(6),
            getOpnameSummary(),
            getMovementSummary(),
        ]);

    const getMovementBadgeClass = (type: string) => {
        switch (type) {
            case 'RECEIVE':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'ISSUE':
                return 'bg-orange-50 text-orange-700 border-orange-200';
            case 'TRANSFER':
                return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'RETURN':
                return 'bg-purple-50 text-purple-700 border-purple-200';
            case 'ADJUSTMENT':
                return 'bg-amber-50 text-amber-700 border-amber-200';
            default:
                return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
            {/* Executive Hero Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/60">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Executive Overview
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                        Admin Control Desk
                    </h1>
                    <p className="text-sm text-slate-500">
                        Pusat kendali master data, inventaris global, audit sistem, dan metrik operasional
                    </p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                    <Link href="/users">
                        <Button size="sm" variant="outline" className="gap-1.5 rounded-xl border-indigo-200 bg-indigo-50/70 text-indigo-700 hover:bg-indigo-100">
                            <Users className="h-4 w-4 text-indigo-600" />
                            Manajemen User
                        </Button>
                    </Link>
                    <Link href="/items">
                        <Button size="sm" className="gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                            <PlusCircle className="h-4 w-4" />
                            Tambah Barang
                        </Button>
                    </Link>
                    <Link href="/audit">
                        <Button size="sm" variant="outline" className="gap-1.5 rounded-xl border-slate-200/80 bg-white/80 hover:bg-slate-100">
                            <ShieldAlert className="h-4 w-4 text-slate-600" />
                            Audit Trail
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Apple Silicon Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <MetricCard
                    title="Total Master Barang"
                    value={counts.activeItems}
                    description="Katalog barang SKU terdaftar"
                    icon={Package}
                    variant="indigo"
                />
                <MetricCard
                    title="Infrastruktur Gudang"
                    value={counts.activeWarehouses}
                    description={`${counts.activeLocations} zona rak penyimpanan`}
                    icon={Warehouse}
                    variant="default"
                />
                <MetricCard
                    title="Volume Persediaan"
                    value={counts.totalInventoryQty.toLocaleString()}
                    description="Total unit stok fisik terverifikasi"
                    icon={Boxes}
                    variant="success"
                />
                <MetricCard
                    title="Peringatan Stok Rendah"
                    value={counts.lowStockCount}
                    description="Barang di bawah batas minimum"
                    icon={AlertTriangle}
                    variant={counts.lowStockCount > 0 ? 'danger' : 'default'}
                    badge={counts.lowStockCount > 0 ? 'Perlu Restock' : 'Aman'}
                />
            </div>

            {/* Section 2: Low Stock Table & Recent Movements */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Low Stock Glass Card */}
                <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
                    <div className="flex items-center justify-between pb-4 mb-2 border-b border-slate-100">
                        <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-rose-500" />
                                <h3 className="font-bold text-slate-900 text-base tracking-tight">
                                    Peringatan Stok Kritis
                                </h3>
                            </div>
                            <p className="text-xs text-slate-500">Persediaan di bawah atau sama dengan batas aman</p>
                        </div>
                        <Link href="/reports/low-stock">
                            <Button variant="ghost" size="sm" className="text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl">
                                Selengkapnya <ArrowRight className="h-3.5 w-3.5 ml-1" />
                            </Button>
                        </Link>
                    </div>

                    {lowStockItems.length === 0 ? (
                        <p className="text-xs text-slate-400 py-8 text-center">
                            Semua stok fisik berada pada tingkat aman.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                                        <th className="pb-2.5">SKU</th>
                                        <th className="pb-2.5">Nama Item</th>
                                        <th className="pb-2.5 text-right">Stok</th>
                                        <th className="pb-2.5 text-right">Min</th>
                                        <th className="pb-2.5 text-right">Defisit</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {lowStockItems.map((item) => (
                                        <tr key={item.sku} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="py-2.5 font-mono font-bold text-slate-800">
                                                {item.sku}
                                            </td>
                                            <td className="py-2.5 text-slate-700 font-medium">{item.name}</td>
                                            <td className="py-2.5 text-right font-bold text-rose-600">
                                                {item.totalStock}
                                            </td>
                                            <td className="py-2.5 text-right text-slate-500">{item.minStock}</td>
                                            <td className="py-2.5 text-right font-bold text-rose-600">
                                                -{item.deficit}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Recent Movements Glass Card */}
                <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
                    <div className="flex items-center justify-between pb-4 mb-2 border-b border-slate-100">
                        <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                                <Activity className="h-4 w-4 text-blue-500" />
                                <h3 className="font-bold text-slate-900 text-base tracking-tight">
                                    Buku Besar Mutasi Terakhir
                                </h3>
                            </div>
                            <p className="text-xs text-slate-500">Rekaman pergerakan inventaris (append-only ledger)</p>
                        </div>
                        <Link href="/reports/movements">
                            <Button variant="ghost" size="sm" className="text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl">
                                Semua Mutasi <ArrowRight className="h-3.5 w-3.5 ml-1" />
                            </Button>
                        </Link>
                    </div>

                    {recentMovements.length === 0 ? (
                        <p className="text-xs text-slate-400 py-8 text-center">
                            Belum ada pergerakan stok tercatat.
                        </p>
                    ) : (
                        <div className="space-y-2.5">
                            {recentMovements.map((m) => (
                                <div
                                    key={m._id}
                                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-white/60 hover:bg-slate-50 transition-colors"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <span
                                            className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border uppercase ${getMovementBadgeClass(
                                                m.type
                                            )}`}
                                        >
                                            {m.type}
                                        </span>
                                        <div>
                                            <p className="text-xs font-bold text-slate-800 font-mono">
                                                {m.sku}
                                            </p>
                                            <p className="text-[10px] text-slate-400">
                                                {m.movementNumber} • {m.actorName}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-extrabold text-slate-900">
                                            {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                                        </p>
                                        <p className="text-[10px] text-slate-400">
                                            {new Date(m.timestamp).toLocaleTimeString('id-ID', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Section 3: Summary Analytics & Navigation Tiles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Movement Distribution */}
                <div className="glass-card rounded-2xl p-5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                        <Layers className="h-3.5 w-3.5 text-indigo-500" />
                        Sebaran Jenis Mutasi
                    </h4>
                    <div className="space-y-2">
                        {movementSummary.map((ms) => (
                            <div key={ms.type} className="flex justify-between items-center text-xs py-1.5 border-b border-slate-100 last:border-0">
                                <span className="text-slate-600 font-semibold">{ms.type}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] text-slate-400">{ms.count}x</span>
                                    <span className="text-[11px] font-bold text-slate-900">{ms.totalQuantity} unit</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Stock Opname Health */}
                <div className="glass-card rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                            <FileSpreadsheet className="h-3.5 w-3.5 text-teal-500" />
                            Dokumen Opname
                        </h4>
                        <Link href="/reports/opnames">
                            <Button variant="ghost" size="sm" className="h-6 text-[11px] text-indigo-600 px-1">
                                Rekap
                            </Button>
                        </Link>
                    </div>
                    <div className="space-y-2">
                        {opnameSummary.length === 0 ? (
                            <p className="text-xs text-slate-400 py-4 text-center">Belum ada dokumen opname</p>
                        ) : (
                            opnameSummary.map((os) => (
                                <div key={os.status} className="flex justify-between items-center text-xs py-1.5 border-b border-slate-100 last:border-0">
                                    <span className="text-slate-600 font-medium">{os.status}</span>
                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">
                                        {os.count}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Fast Access to Master Data */}
                <div className="glass-card rounded-2xl p-5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                        <ShieldCheck className="h-3.5 w-3.5 text-indigo-500" />
                        Akses Master Data
                    </h4>
                    <div className="space-y-1.5">
                        <Link href="/items" className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-100/80 transition text-xs font-medium text-slate-700">
                            <span>Katalog Barang & SKU</span>
                            <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                        </Link>
                        <Link href="/warehouses" className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-100/80 transition text-xs font-medium text-slate-700">
                            <span>Gudang & Fasilitas</span>
                            <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                        </Link>
                        <Link href="/locations" className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-100/80 transition text-xs font-medium text-slate-700">
                            <span>Zona Rak & Lokasi</span>
                            <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
