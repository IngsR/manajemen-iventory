import React from 'react';
import Link from 'next/link';
import { requirePagePermission } from '@/lib/Auth';
import { getMovementReport, MovementReportRow } from '@/services/reporting/InventoryReportService';
import { MovementType } from '@/models/StockMovementModel';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollText, Filter, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';

interface PageProps {
    searchParams: Promise<{
        page?: string;
        type?: string;
        sku?: string;
        actor?: string;
    }>;
}

export default async function MovementsReportPage({ searchParams }: PageProps) {
    // Server-side authorization boundary (all roles hold MOVEMENT_VIEW).
    const user = await requirePagePermission('MOVEMENT_VIEW');

    const sp = await searchParams;
    const page = parseInt(sp.page || '1', 10) || 1;
    const type = sp.type as MovementType | undefined;
    const sku = sp.sku || undefined;
    const actor = sp.actor || undefined;

    const report = await getMovementReport(
        {
            type: type || undefined,
            sku,
            actor,
        },
        page,
        20
    );

    const getMovementBadgeVariant = (mType: MovementType) => {
        switch (mType) {
            case 'RECEIVE':
                return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'ISSUE':
                return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'TRANSFER':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'RETURN':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'ADJUSTMENT':
                return 'bg-amber-100 text-amber-800 border-amber-200';
            default:
                return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    const buildQueryString = (newPage: number) => {
        const params = new URLSearchParams();
        params.set('page', String(newPage));
        if (type) params.set('type', type);
        if (sku) params.set('sku', sku);
        if (actor) params.set('actor', actor);
        return params.toString();
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                    <ScrollText className="h-6 w-6 text-blue-600" />
                    Laporan Riwayat Mutasi Persediaan
                </h1>
                <p className="text-sm text-slate-500">
                    Buku besar immutable ledger untuk seluruh pergerakan stok masuk, keluar, dan pemindahan
                </p>
            </div>

            {/* Filter Bar */}
            <Card className="border-slate-200">
                <CardHeader className="py-3 px-4 bg-slate-50/50 border-b border-slate-100">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Filter className="h-3.5 w-3.5" /> Filter Pencarian Mutasi
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                    <form method="GET" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
                        <div>
                            <label className="text-xs font-medium text-slate-700 block mb-1">Jenis Transaksi</label>
                            <select
                                name="type"
                                defaultValue={type || ''}
                                className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="">Semua Jenis Transaksi</option>
                                <option value="RECEIVE">RECEIVE (Penerimaan)</option>
                                <option value="ISSUE">ISSUE (Pengeluaran)</option>
                                <option value="TRANSFER">TRANSFER (Pindah Lokasi)</option>
                                <option value="RETURN">RETURN (Retur)</option>
                                <option value="ADJUSTMENT">ADJUSTMENT (Koreksi)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-700 block mb-1">Cari SKU</label>
                            <Input
                                name="sku"
                                placeholder="Contoh: BRG-001"
                                defaultValue={sku || ''}
                                className="h-9 text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-700 block mb-1">Nama Petugas / Aktor</label>
                            <Input
                                name="actor"
                                placeholder="Nama pengguna..."
                                defaultValue={actor || ''}
                                className="h-9 text-sm"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white flex-1 h-9">
                                Terapkan Filter
                            </Button>
                            {(type || sku || actor) && (
                                <Link href="/reports/movements">
                                    <Button type="button" variant="outline" size="sm" className="h-9 px-2.5" title="Reset Filter">
                                        <RotateCcw className="h-4 w-4 text-slate-500" />
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Table */}
            <Card className="border-slate-200">
                <CardContent className="p-0">
                    {report.data.length === 0 ? (
                        <div className="p-8">
                            <EmptyState
                                title="Tidak ada catatan mutasi"
                                description="Tidak ada data mutasi yang sesuai dengan kriteria filter saat ini."
                            />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
                                        <th className="py-3 px-4">No. Mutasi</th>
                                        <th className="py-3 px-4">Waktu</th>
                                        <th className="py-3 px-4">Tipe</th>
                                        <th className="py-3 px-4">SKU</th>
                                        <th className="py-3 px-4 text-right">Kuantitas</th>
                                        <th className="py-3 px-4">Petugas</th>
                                        <th className="py-3 px-4">Referensi / Alasan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {report.data.map((row: MovementReportRow) => (
                                        <tr key={row._id} className="hover:bg-slate-50/80 transition">
                                            <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-700">
                                                {row.movementNumber}
                                            </td>
                                            <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                                                {new Date(row.timestamp).toLocaleDateString('id-ID', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span
                                                    className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getMovementBadgeVariant(
                                                        row.type
                                                    )}`}
                                                >
                                                    {row.type}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 font-mono text-xs font-bold text-slate-800">
                                                {row.sku}
                                            </td>
                                            <td className="py-3 px-4 text-right font-semibold text-slate-900">
                                                {row.quantity > 0 ? `+${row.quantity}` : row.quantity}
                                            </td>
                                            <td className="py-3 px-4 text-xs text-slate-700">
                                                <div>{row.actorName}</div>
                                                <span className="text-[10px] text-slate-400 uppercase font-mono">
                                                    {row.actorRole}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-xs text-slate-500 max-w-xs truncate">
                                                {row.referenceNumber && (
                                                    <span className="font-mono text-slate-700 mr-1">
                                                        [{row.referenceNumber}]
                                                    </span>
                                                )}
                                                {row.reason || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {report.totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/40">
                            <span className="text-xs text-slate-500">
                                Menampilkan halaman {report.page} dari {report.totalPages} ({report.total} total transaksi)
                            </span>
                            <div className="flex items-center gap-1">
                                {report.page > 1 ? (
                                    <Link href={`/reports/movements?${buildQueryString(report.page - 1)}`}>
                                        <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
                                            <ChevronLeft className="h-3.5 w-3.5" /> Sebelumnya
                                        </Button>
                                    </Link>
                                ) : (
                                    <Button variant="outline" size="sm" disabled className="h-8 gap-1 text-xs opacity-50">
                                        <ChevronLeft className="h-3.5 w-3.5" /> Sebelumnya
                                    </Button>
                                )}

                                {report.page < report.totalPages ? (
                                    <Link href={`/reports/movements?${buildQueryString(report.page + 1)}`}>
                                        <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
                                            Berikutnya <ChevronRight className="h-3.5 w-3.5" />
                                        </Button>
                                    </Link>
                                ) : (
                                    <Button variant="outline" size="sm" disabled className="h-8 gap-1 text-xs opacity-50">
                                        Berikutnya <ChevronRight className="h-3.5 w-3.5" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
