import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/Auth';
import {
    getDashboardCounts,
    getRecentMovements,
} from '@/services/reporting/DashboardService';
import { MetricCard } from '@/components/MetricCard';
import { QuickTransactionTerminal } from '@/components/inventory/quick-transaction-terminal';
import { Button } from '@/components/ui/button';
import {
    ArrowDownToLine,
    ArrowUpFromLine,
    ArrowLeftRight,
    RotateCcw,
    SlidersHorizontal,
    ClipboardPen,
    Package,
    Boxes,
    Warehouse,
    Activity,
    ArrowRight,
    Zap,
} from 'lucide-react';

export default async function PetugasDashboardPage() {
    const user = await getCurrentUser();
    if (!user) {
        redirect('/login');
    }
    if (user.role !== 'PETUGAS' && user.role !== 'ADMIN') {
        redirect('/');
    }

    const [counts, recentMovements] = await Promise.all([
        getDashboardCounts(),
        getRecentMovements(8),
    ]);

    const operations = [
        {
            title: 'Penerimaan (Receive)',
            desc: 'Catat barang masuk dari supplier atau vendor ke gudang',
            href: '/inventory/receive',
            icon: ArrowDownToLine,
            accent: 'text-emerald-700 bg-emerald-50/80 border-emerald-200/70',
            glow: 'hover:border-emerald-400',
        },
        {
            title: 'Pengeluaran (Issue)',
            desc: 'Catat barang keluar untuk kebutuhan unit atau produksi',
            href: '/inventory/issue',
            icon: ArrowUpFromLine,
            accent: 'text-orange-700 bg-orange-50/80 border-orange-200/70',
            glow: 'hover:border-orange-400',
        },
        {
            title: 'Transfer Lokasi',
            desc: 'Pindahkan stok antar rak atau zona dalam satu gudang',
            href: '/inventory/transfer',
            icon: ArrowLeftRight,
            accent: 'text-blue-700 bg-blue-50/80 border-blue-200/70',
            glow: 'hover:border-blue-400',
        },
        {
            title: 'Retur Barang',
            desc: 'Pencatatan pengembalian barang dari pengeluaran sebelumnya',
            href: '/inventory/return',
            icon: RotateCcw,
            accent: 'text-purple-700 bg-purple-50/80 border-purple-200/70',
            glow: 'hover:border-purple-400',
        },
        {
            title: 'Penyesuaian (Adjustment)',
            desc: 'Koreksi stok langsung akibat selisih fisik, susut atau rusak',
            href: '/inventory/adjustment',
            icon: SlidersHorizontal,
            accent: 'text-amber-700 bg-amber-50/80 border-amber-200/70',
            glow: 'hover:border-amber-400',
        },
        {
            title: 'Input Hitung Opname',
            desc: 'Catat hasil hitung fisik berkala untuk verifikasi Supervisor',
            href: '/inventory/stock-opname',
            icon: ClipboardPen,
            accent: 'text-teal-700 bg-teal-50/80 border-teal-200/70',
            glow: 'hover:border-teal-400',
        },
    ];

    return (
        <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
            {/* Officer Hero Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/60">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Warehouse Operations Terminal
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                        Officer Floor Station
                    </h1>
                    <p className="text-sm text-slate-500">
                        Pusat pencatatan mutasi fisik, eksekusi transaksi inventaris, dan input stock opname
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-500 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200/60 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        Sistem Siap Operasi
                    </span>
                </div>
            </div>

            {/* Apple Silicon Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <MetricCard
                    title="Katalog Barang Tersedia"
                    value={counts.activeItems}
                    description="Item aktif yang dapat ditransaksikan"
                    icon={Package}
                    variant="default"
                />
                <MetricCard
                    title="Total Stok Fisik Gudang"
                    value={counts.totalInventoryQty.toLocaleString()}
                    description="Kuantitas terdaftar di seluruh lokasi"
                    icon={Boxes}
                    variant="success"
                />
                <MetricCard
                    title="Fasilitas & Lokasi"
                    value={`${counts.activeWarehouses} Gudang`}
                    description={`${counts.activeLocations} lokasi/rak terdaftar`}
                    icon={Warehouse}
                    variant="default"
                />
            </div>

            {/* Integrated Fast Transaction Terminal */}
            <QuickTransactionTerminal />

            {/* Tactile Operational Action Center */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <Zap className="h-4 w-4 text-emerald-600" />
                        Aksi Cepat Transaksi Fisik
                    </h2>
                    <span className="text-xs text-slate-400">Pilih modul untuk mencatat transaksi</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {operations.map((op) => {
                        const Icon = op.icon;
                        return (
                            <Link
                                key={op.href}
                                href={op.href}
                                className={`glass-card rounded-2xl p-5 relative overflow-hidden group flex flex-col justify-between transition-all duration-300 ${op.glow}`}
                            >
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className={`p-2.5 rounded-xl border shadow-sm ${op.accent}`}>
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div className="h-7 w-7 rounded-full bg-slate-100/70 flex items-center justify-center text-slate-400 group-hover:text-slate-800 group-hover:bg-slate-200/70 transition-colors">
                                            <ArrowRight className="h-3.5 w-3.5" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-sm tracking-tight group-hover:text-emerald-700 transition-colors">
                                            {op.title}
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                            {op.desc}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Recent Transaction Activity Stream */}
            <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
                <div className="flex items-center justify-between pb-4 mb-2 border-b border-slate-100">
                    <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-emerald-600" />
                            <h3 className="font-bold text-slate-900 text-base tracking-tight">
                                Catatan Transaksi Terakhir di Gudang
                            </h3>
                        </div>
                        <p className="text-xs text-slate-500">Histori mutasi yang baru saja diproses oleh petugas</p>
                    </div>
                    <Link href="/reports/movements">
                        <Button variant="ghost" size="sm" className="text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-xl">
                            Riwayat Lengkap <ArrowRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                    </Link>
                </div>

                {recentMovements.length === 0 ? (
                    <p className="text-xs text-slate-400 py-8 text-center">
                        Belum ada pergerakan barang yang dicatat.
                    </p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {recentMovements.map((m) => (
                            <div
                                key={m._id}
                                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white/70 hover:bg-slate-50 transition-colors text-xs"
                            >
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            {m.type}
                                        </span>
                                        <span className="font-mono font-bold text-slate-900">
                                            {m.sku}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-1">
                                        {m.movementNumber} • oleh {m.actorName}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-extrabold text-slate-900 block">
                                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
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
    );
}
