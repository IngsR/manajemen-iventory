import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/Auth';
import { hasPermission } from '@/lib/Permissions';
import { getStockOpnames } from '@/services/inventory/StockOpnameService';
import { getWarehouseCollection } from '@/models/WarehouseModel';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { StatusDot } from '@/components/shared/StatusDot';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    ClipboardPen,
    Plus,
    Warehouse,
    Calendar,
    ArrowRight,
    ShieldX,
    ArrowLeft,
    Clock,
    User,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function StockOpnameListPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login');
    }

    if (!hasPermission(user.role, 'STOCK_OPNAME_VIEW')) {
        return (
            <div className="max-w-md mx-auto my-12 animate-scale-in">
                <Card className="glass-card border-rose-200/80 shadow-lg text-center p-6">
                    <CardContent className="space-y-4 pt-4">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 border border-rose-200 text-rose-600">
                            <ShieldX className="h-7 w-7" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-900">Akses Ditolak</h2>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Peran Anda ({user.role}) tidak memiliki izin melihat dokumen Stock Opname.
                        </p>
                        <Link href="/">
                            <Button variant="outline" size="sm" className="rounded-xl text-xs mt-2">
                                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                                Kembali ke Beranda
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const opnames = await getStockOpnames();
    const warehouseCol = await getWarehouseCollection();
    const warehouses = await warehouseCol.find({}).toArray();
    const whMap = new Map(warehouses.map((w) => [w._id.toHexString(), w.name]));

    const canCreate = hasPermission(user.role, 'STOCK_OPNAME_CREATE');

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return {
                    variant: 'success' as const,
                    badgeClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
                };
            case 'REJECTED':
                return {
                    variant: 'danger' as const,
                    badgeClass: 'border-rose-200 bg-rose-50 text-rose-700',
                };
            case 'SUBMITTED':
                return {
                    variant: 'warning' as const,
                    badgeClass: 'border-amber-200 bg-amber-50 text-amber-700',
                };
            default:
                return {
                    variant: 'neutral' as const,
                    badgeClass: 'border-slate-200 bg-slate-50 text-slate-600',
                };
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
            <PageHeader
                title="Pemeriksaan Fisik (Stock Opname)"
                subtitle="Pencocokan kuantitas fisik gudang dengan sistem &amp; antrean review verifikasi Supervisor."
                icon={ClipboardPen}
                badge={{
                    label: user.role === 'SUPERVISOR' ? 'OVERSIGHT & APPROVAL' : 'TERMINAL OPERASIONAL',
                    variant: user.role === 'SUPERVISOR' ? 'supervisor' : 'petugas',
                }}
                breadcrumbs={[
                    { label: 'StockFlow', href: '/' },
                    { label: 'Stock Opname' },
                ]}
                actions={
                    canCreate ? (
                        <Link href="/inventory/stock-opname/create">
                            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 rounded-xl shadow-sm">
                                <Plus className="h-3.5 w-3.5 mr-1.5" />
                                Buat Dokumen Opname Baru
                            </Button>
                        </Link>
                    ) : undefined
                }
            />

            <DataTable
                title="Daftar Dokumen Stock Opname"
                description="Riwayat proses hitung fisik, status draft, pengajuan, dan persetujuan penyesuaian stok."
                badgeCount={opnames.length}
                dataLength={opnames.length}
                emptyTitle="Belum Ada Dokumen Opname"
                emptyDescription="Mulai pencocokan persediaan dengan membuat dokumen opname baru."
                emptyIcon={ClipboardPen}
                emptyAction={
                    canCreate ? (
                        <Link href="/inventory/stock-opname/create">
                            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 rounded-xl">
                                <Plus className="h-3.5 w-3.5 mr-1.5" />
                                Buat Draft Opname
                            </Button>
                        </Link>
                    ) : undefined
                }
            >
                <Table>
                    <TableHeader className="bg-slate-50/75">
                        <TableRow>
                            <TableHead className="w-[180px] text-xs font-bold text-slate-700">NO. DOKUMEN</TableHead>
                            <TableHead className="text-xs font-bold text-slate-700">FASILITAS GUDANG</TableHead>
                            <TableHead className="w-[140px] text-xs font-bold text-slate-700">STATUS REVIEW</TableHead>
                            <TableHead className="w-[180px] text-xs font-bold text-slate-700">PETUGAS PENCATAT</TableHead>
                            <TableHead className="w-[150px] text-xs font-bold text-slate-700">TANGGAL PEMBUATAN</TableHead>
                            <TableHead className="w-[130px] text-right text-xs font-bold text-slate-700">AKSI</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {opnames.map((op) => {
                            const badgeInfo = getStatusBadge(op.status);
                            return (
                                <TableRow key={op._id.toHexString()} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="font-mono text-xs font-bold text-slate-900">
                                        {op.opnameNumber}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                                            <Warehouse className="h-3.5 w-3.5 text-slate-400" />
                                            <span>{whMap.get(op.warehouseId.toHexString()) || 'Gudang'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={`text-[11px] font-bold ${badgeInfo.badgeClass}`}
                                        >
                                            <StatusDot
                                                variant={badgeInfo.variant}
                                                size="sm"
                                                className="mr-1.5"
                                            />
                                            {op.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs text-slate-600">
                                        <div className="flex items-center gap-1.5">
                                            <User className="h-3 w-3 text-slate-400" />
                                            <span>{op.createdBy.name}</span>
                                            <span className="text-[10px] text-slate-400 font-mono">
                                                ({op.createdBy.role})
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-xs text-slate-500 font-mono">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="h-3 w-3 text-slate-400" />
                                            <span>{new Date(op.createdAt).toLocaleDateString('id-ID')}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/inventory/stock-opname/${op._id.toHexString()}`}>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 px-2.5 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                            >
                                                Buka Detail
                                                <ArrowRight className="h-3.5 w-3.5 ml-1" />
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </DataTable>
        </div>
    );
}
