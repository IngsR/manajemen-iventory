import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/Auth';
import { hasPermission } from '@/lib/Permissions';
import { getStockOpnameDetail } from '@/services/inventory/StockOpnameService';
import { getItemCollection } from '@/models/ItemModel';
import { getLocationCollection } from '@/models/LocationModel';
import {
    addStockOpnameItemAction,
    removeStockOpnameItemAction,
    submitStockOpnameAction,
    approveStockOpnameAction,
    rejectStockOpnameAction,
    setAllOpnameItemsMatchedAction,
    populateStockOpnameAction,
} from '@/actions/StockOpnameActions';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { FormCard } from '@/components/shared/FormCard';
import { StatusDot } from '@/components/shared/StatusDot';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    Warehouse,
    Calendar,
    User,
    CheckCircle2,
    XCircle,
    Send,
    Plus,
    Trash2,
    ShieldCheck,
    ShieldX,
    ArrowLeft,
    AlertCircle,
    Check,
    X,
    CheckCheck,
    RotateCcw,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function StockOpnameDetailPage({ params }: PageProps) {
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
                            Anda tidak memiliki izin melihat dokumen Stock Opname.
                        </p>
                        <Link href="/inventory/stock-opname">
                            <Button variant="outline" size="sm" className="rounded-xl text-xs mt-2">
                                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                                Kembali
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const { id } = await params;
    const opname = await getStockOpnameDetail(id);

    if (!opname) {
        notFound();
    }

    const canEdit = opname.status === 'DRAFT' && hasPermission(user.role, 'STOCK_OPNAME_CREATE');
    const canSubmit = opname.status === 'DRAFT' && hasPermission(user.role, 'STOCK_OPNAME_SUBMIT') && opname.items.length > 0;
    const canReview = opname.status === 'SUBMITTED' && (hasPermission(user.role, 'STOCK_OPNAME_APPROVE') || hasPermission(user.role, 'STOCK_OPNAME_REJECT'));

    const itemsCol = await getItemCollection();
    const availableItems = await itemsCol.find({ isDeleted: false, status: 'ACTIVE' }).sort({ name: 1 }).toArray();

    const locCol = await getLocationCollection();
    const availableLocations = await locCol.find({ warehouseId: opname.warehouseId, isDeleted: false, status: 'ACTIVE' }).sort({ code: 1 }).toArray();

    const getStatusStyle = (status: string) => {
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

    const statusStyle = getStatusStyle(opname.status);

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
            <PageHeader
                title={`Opname #${opname.opnameNumber}`}
                subtitle={`Pemeriksaan fisik gudang ${opname.warehouseName || 'Gudang'} • ID: ${opname._id.toHexString()}`}
                icon={ClipboardPen}
                breadcrumbs={[
                    { label: 'StockFlow', href: '/' },
                    { label: 'Stock Opname', href: '/inventory/stock-opname' },
                    { label: opname.opnameNumber },
                ]}
                actions={
                    <div className="flex flex-wrap items-center gap-2">
                        {canEdit && opname.items.length > 0 && (
                            <form
                                action={async () => {
                                    'use server';
                                    await setAllOpnameItemsMatchedAction(opname._id.toHexString());
                                }}
                            >
                                <Button
                                    type="submit"
                                    variant="outline"
                                    className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-xs h-9 rounded-xl shadow-xs"
                                    title="Set seluruh hitung fisik sama dengan saldo sistem (0 selisih)"
                                >
                                    <CheckCheck className="h-3.5 w-3.5 mr-1.5" />
                                    Set Semua Sesuai Fisik (0 Selisih)
                                </Button>
                            </form>
                        )}

                        {canEdit && (
                            <form
                                action={async () => {
                                    'use server';
                                    await populateStockOpnameAction(opname._id.toHexString());
                                }}
                            >
                                <Button
                                    type="submit"
                                    variant="ghost"
                                    className="text-slate-600 hover:bg-slate-100 text-xs h-9 rounded-xl"
                                    title="Muat ulang snapshot stok dari database"
                                >
                                    <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                                    Muat Snapshot
                                </Button>
                            </form>
                        )}

                        {canSubmit && (
                            <form
                                action={async () => {
                                    'use server';
                                    await submitStockOpnameAction(opname._id.toHexString());
                                }}
                            >
                                <Button
                                    type="submit"
                                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-9 rounded-xl shadow-sm"
                                >
                                    <Send className="h-3.5 w-3.5 mr-1.5" />
                                    Ajukan ke Supervisor
                                </Button>
                            </form>
                        )}
                    </div>
                }
            />

            {/* Document Header Summary Card */}
            <Card className="glass-card border-slate-200/80 p-5 shadow-xs">
                <CardContent className="p-0 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <Badge variant="outline" className={`text-xs font-bold px-3 py-1 ${statusStyle.badgeClass}`}>
                                <StatusDot variant={statusStyle.variant} size="sm" className="mr-1.5" />
                                STATUS: {opname.status}
                            </Badge>
                            <span className="text-xs text-slate-500">
                                Gudang: <strong className="text-slate-800">{opname.warehouseName || 'Gudang'}</strong>
                            </span>
                        </div>

                        <div className="text-xs text-slate-500 flex items-center gap-2">
                            <span>Dibuat oleh: <strong className="text-slate-700">{opname.createdBy.name}</strong></span>
                            <span>•</span>
                            <span className="font-mono">{new Date(opname.createdAt).toLocaleString('id-ID')}</span>
                        </div>
                    </div>

                    {opname.notes && (
                        <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                            &ldquo;{opname.notes}&rdquo;
                        </p>
                    )}

                    {opname.status === 'APPROVED' && opname.reviewedBy && (
                        <div className="flex items-center gap-2 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200/80 p-3 rounded-xl">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                            <span>
                                Disetujui oleh <strong>{opname.reviewedBy.name}</strong> ({opname.reviewedBy.role}) pada{' '}
                                {opname.reviewedAt ? new Date(opname.reviewedAt).toLocaleString('id-ID') : '-'}
                            </span>
                        </div>
                    )}

                    {opname.status === 'REJECTED' && (
                        <div className="flex items-start gap-2 text-xs font-medium text-rose-800 bg-rose-50 border border-rose-200/80 p-3 rounded-xl">
                            <XCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                            <div>
                                <div>Ditolak oleh <strong>{opname.reviewedBy?.name || 'Supervisor'}</strong></div>
                                {opname.rejectionReason && (
                                    <div className="text-rose-700 mt-1 font-normal">
                                        Alasan penolakan: &ldquo;{opname.rejectionReason}&rdquo;
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Supervisor Review Panel */}
            {canReview && (
                <Card className="glass-card border-amber-300 bg-amber-50/40 p-5 shadow-sm">
                    <CardContent className="p-0 space-y-3">
                        <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                            <ShieldCheck className="h-4 w-4 text-amber-600" />
                            <span>Panel Tindakan Review Supervisor</span>
                        </div>
                        <p className="text-xs text-amber-800 leading-relaxed">
                            Silakan audit detail hasil hitung fisik di bawah. Persetujuan dokumen akan mengeksekusi penyesuaian saldo stok di database secara otomatis &amp; atomik.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <form
                                action={async () => {
                                    'use server';
                                    await approveStockOpnameAction(opname._id.toHexString());
                                }}
                            >
                                <Button
                                    type="submit"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 rounded-xl shadow-xs"
                                >
                                    <Check className="h-3.5 w-3.5 mr-1.5" />
                                    Setujui Dokumen (Approve)
                                </Button>
                            </form>

                            <form
                                action={async (formData) => {
                                    'use server';
                                    await rejectStockOpnameAction(formData);
                                }}
                                className="flex flex-1 items-center gap-2"
                            >
                                <input type="hidden" name="stockOpnameId" value={opname._id.toHexString()} />
                                <Input
                                    name="rejectionReason"
                                    required
                                    placeholder="Tulis alasan jika ditolak..."
                                    className="text-xs h-9 rounded-xl bg-white border-rose-200 focus-visible:ring-rose-500"
                                />
                                <Button
                                    type="submit"
                                    variant="outline"
                                    className="border-rose-300 text-rose-700 hover:bg-rose-50 text-xs h-9 rounded-xl shrink-0"
                                >
                                    <X className="h-3.5 w-3.5 mr-1.5" />
                                    Tolak (Reject)
                                </Button>
                            </form>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Detail Items Table */}
            <DataTable
                title="Detail Hasil Hitung Fisik"
                description="Daftar item komoditas yang diverifikasi kuantitas fisiknya di lapangan."
                badgeCount={opname.items.length}
                dataLength={opname.items.length}
                emptyTitle="Belum Ada Item Terhitung"
                emptyDescription="Masukkan item dan hasil hitung fisik menggunakan formulir di bawah."
                emptyIcon={ClipboardPen}
            >
                <Table>
                    <TableHeader className="bg-slate-50/75">
                        <TableRow>
                            <TableHead className="w-[140px] text-xs font-bold text-slate-700">SKU</TableHead>
                            <TableHead className="text-xs font-bold text-slate-700">NAMA KOMODITAS</TableHead>
                            <TableHead className="w-[160px] text-xs font-bold text-slate-700">LOKASI RAK</TableHead>
                            <TableHead className="w-[130px] text-right text-xs font-bold text-slate-700">SNAPSHOT SISTEM</TableHead>
                            <TableHead className="w-[120px] text-right text-xs font-bold text-slate-700">HITUNG FISIK</TableHead>
                            <TableHead className="w-[110px] text-right text-xs font-bold text-slate-700">SELISIH</TableHead>
                            {canEdit && <TableHead className="w-[80px] text-center text-xs font-bold text-slate-700">AKSI</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {opname.items.map((item) => {
                            const isDiff = item.difference !== 0;
                            const diffColor =
                                item.difference > 0
                                    ? 'text-emerald-600 font-bold'
                                    : item.difference < 0
                                    ? 'text-rose-600 font-bold'
                                    : 'text-slate-400 font-medium';

                            return (
                                <TableRow key={item._id.toHexString()} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="font-mono text-xs font-bold text-slate-900">
                                        {item.sku}
                                    </TableCell>
                                    <TableCell className="text-xs font-semibold text-slate-800">
                                        {item.itemName || '-'}
                                    </TableCell>
                                    <TableCell className="text-xs text-slate-500 font-mono">
                                        {item.locationCode} ({item.locationName})
                                    </TableCell>
                                    <TableCell className="text-right text-xs font-mono text-slate-600">
                                        {item.systemQuantity}
                                    </TableCell>
                                    <TableCell className="text-right text-xs font-mono font-bold text-slate-900">
                                        {item.countedQuantity}
                                    </TableCell>
                                    <TableCell className={`text-right text-xs font-mono ${diffColor}`}>
                                        {item.difference > 0 ? `+${item.difference}` : item.difference}
                                    </TableCell>
                                    {canEdit && (
                                        <TableCell className="text-center">
                                            <form
                                                action={async () => {
                                                    'use server';
                                                    await removeStockOpnameItemAction(
                                                        opname._id.toHexString(),
                                                        item._id.toHexString()
                                                    );
                                                }}
                                            >
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    type="submit"
                                                    className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                                    title="Hapus baris"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </form>
                                        </TableCell>
                                    )}
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </DataTable>

            {/* Add Count Form for DRAFT */}
            {canEdit && (
                <FormCard
                    title="Input Hasil Hitung Fisik Lapangan"
                    description="Tambahkan atau perbarui kuantitas fisik yang ditemukan pada rak/bin terkait."
                    icon={Plus}
                    footer={
                        <Button
                            type="submit"
                            form="add-item-opname-form"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 rounded-xl shadow-sm px-5"
                        >
                            <Plus className="h-3.5 w-3.5 mr-1.5" />
                            Simpan Hitung Fisik
                        </Button>
                    }
                >
                    <form
                        id="add-item-opname-form"
                        action={async (formData) => {
                            'use server';
                            await addStockOpnameItemAction(formData);
                        }}
                        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                    >
                        <input type="hidden" name="stockOpnameId" value={opname._id.toHexString()} />

                        <div className="space-y-1.5">
                            <Label htmlFor="opn-item">Komoditas Barang (SKU) *</Label>
                            <select
                                id="opn-item"
                                name="itemId"
                                required
                                className="w-full text-xs h-9 rounded-xl border border-input bg-background px-3"
                            >
                                <option value="">-- Pilih Barang SKU --</option>
                                {availableItems.map((i) => (
                                    <option key={i._id.toHexString()} value={i._id.toHexString()}>
                                        [{i.sku}] {i.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="opn-loc">Lokasi Rak / Bin *</Label>
                            <select
                                id="opn-loc"
                                name="locationId"
                                required
                                className="w-full text-xs h-9 rounded-xl border border-input bg-background px-3"
                            >
                                <option value="">-- Pilih Lokasi --</option>
                                {availableLocations.map((l) => (
                                    <option key={l._id.toHexString()} value={l._id.toHexString()}>
                                        [{l.code}] {l.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="opn-qty">Hasil Hitung Fisik (Unit) *</Label>
                            <Input
                                id="opn-qty"
                                name="countedQuantity"
                                type="number"
                                min={0}
                                required
                                placeholder="0"
                                className="text-xs h-9 rounded-xl font-mono"
                            />
                        </div>
                    </form>
                </FormCard>
            )}
        </div>
    );
}
