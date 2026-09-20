import React from 'react';
import Link from 'next/link';
import { requirePagePermission } from '@/lib/Auth';
import { getOpnameReport, OpnameReportRow } from '@/services/reporting/InventoryReportService';
import { StockOpnameStatus } from '@/models/StockOpnameModel';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, Filter, ChevronLeft, ChevronRight, RotateCcw, ArrowRight } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';

interface PageProps {
    searchParams: Promise<{
        page?: string;
        status?: string;
    }>;
}

export default async function OpnamesReportPage({ searchParams }: PageProps) {
    // Server-side authorization boundary (admin/supervisor/petugas hold STOCK_OPNAME_VIEW).
    await requirePagePermission('STOCK_OPNAME_VIEW');

    const sp = await searchParams;
    const page = parseInt(sp.page || '1', 10) || 1;
    const status = sp.status as StockOpnameStatus | undefined;

    const report = await getOpnameReport(
        {
            status: status || undefined,
        },
        page,
        20
    );

    const getStatusBadgeVariant = (s: StockOpnameStatus) => {
        switch (s) {
            case 'DRAFT':
                return 'bg-slate-100 text-slate-700 border-slate-300';
            case 'SUBMITTED':
                return 'bg-amber-100 text-amber-800 border-amber-300';
            case 'APPROVED':
                return 'bg-emerald-100 text-emerald-800 border-emerald-300';
            case 'REJECTED':
                return 'bg-rose-100 text-rose-800 border-rose-300';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const buildQueryString = (newPage: number) => {
        const params = new URLSearchParams();
        params.set('page', String(newPage));
        if (status) params.set('status', status);
        return params.toString();
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <FileSpreadsheet className="h-6 w-6 text-teal-600" />
                        Laporan Rekapitulasi Stock Opname
                    </h1>
                    <p className="text-sm text-slate-500">
                        Histori seluruh pelaksanaan hitung fisik persediaan gudang beserta status keputusannya
                    </p>
                </div>
                <Link href="/inventory/stock-opname">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5">
                        Kelola Stock Opname
                    </Button>
                </Link>
            </div>

            {/* Filter Bar */}
            <Card className="border-slate-200">
                <CardHeader className="py-3 px-4 bg-slate-50/50 border-b border-slate-100">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Filter className="h-3.5 w-3.5" /> Filter Status Dokumen
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                    <form method="GET" className="flex flex-wrap items-center gap-3">
                        <div className="min-w-[200px]">
                            <select
                                name="status"
                                defaultValue={status || ''}
                                className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="">Semua Status Dokumen</option>
                                <option value="DRAFT">DRAFT (Pencatatan Fisik)</option>
                                <option value="SUBMITTED">SUBMITTED (Menunggu Approval)</option>
                                <option value="APPROVED">APPROVED (Disetujui & Selesai)</option>
                                <option value="REJECTED">REJECTED (Ditolak)</option>
                            </select>
                        </div>
                        <Button type="submit" size="sm" className="h-9 bg-blue-600 hover:bg-blue-700 text-white">
                            Terapkan Filter
                        </Button>
                        {status && (
                            <Link href="/reports/opnames">
                                <Button type="button" variant="outline" size="sm" className="h-9 px-2.5" title="Reset Filter">
                                    <RotateCcw className="h-4 w-4 text-slate-500" />
                                </Button>
                            </Link>
                        )}
                    </form>
                </CardContent>
            </Card>

            {/* Table */}
            <Card className="border-slate-200">
                <CardContent className="p-0">
                    {report.data.length === 0 ? (
                        <div className="p-8">
                            <EmptyState
                                title="Tidak ada dokumen stock opname"
                                description="Belum ada catatan stock opname yang sesuai dengan filter."
                            />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
                                        <th className="py-3 px-4">No. Opname</th>
                                        <th className="py-3 px-4">Tanggal Buat</th>
                                        <th className="py-3 px-4 text-center">Status</th>
                                        <th className="py-3 px-4 text-center">Jumlah Item</th>
                                        <th className="py-3 px-4">Dibuat Oleh</th>
                                        <th className="py-3 px-4">Direview Oleh</th>
                                        <th className="py-3 px-4 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {report.data.map((row: OpnameReportRow) => (
                                        <tr key={row._id} className="hover:bg-slate-50/80 transition">
                                            <td className="py-3 px-4 font-mono text-xs font-bold text-slate-800">
                                                {row.opnameNumber}
                                            </td>
                                            <td className="py-3 px-4 text-xs text-slate-600">
                                                {new Date(row.createdAt).toLocaleDateString('id-ID', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span
                                                    className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getStatusBadgeVariant(
                                                        row.status
                                                    )}`}
                                                >
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-center font-medium text-slate-800">
                                                {row.itemCount}
                                            </td>
                                            <td className="py-3 px-4 text-xs text-slate-700 font-medium">
                                                {row.createdByName}
                                            </td>
                                            <td className="py-3 px-4 text-xs text-slate-600">
                                                {row.reviewedByName || '-'}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <Link href={`/inventory/stock-opname`}>
                                                    <Button variant="ghost" size="sm" className="h-8 text-xs text-blue-600 hover:text-blue-700 gap-1">
                                                        Buka <ArrowRight className="h-3.5 w-3.5" />
                                                    </Button>
                                                </Link>
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
                                Menampilkan halaman {report.page} dari {report.totalPages} ({report.total} total dokumen)
                            </span>
                            <div className="flex items-center gap-1">
                                {report.page > 1 ? (
                                    <Link href={`/reports/opnames?${buildQueryString(report.page - 1)}`}>
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
                                    <Link href={`/reports/opnames?${buildQueryString(report.page + 1)}`}>
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
