'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    getWarehousesAction,
    createWarehouseAction,
    updateWarehouseAction,
    deleteWarehouseAction,
} from '@/actions/WarehouseActions';
import { PageHeader } from '@/components/shared/PageHeader';
import { FormCard } from '@/components/shared/FormCard';
import { DataTable } from '@/components/shared/DataTable';
import { StatusDot } from '@/components/shared/StatusDot';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Warehouse,
    Plus,
    Check,
    X,
    Pencil,
    Trash2,
    Loader2,
    CheckCircle2,
    AlertCircle,
} from 'lucide-react';

interface WarehouseItem {
    _id: string;
    code: string;
    name: string;
    address?: string;
    status: 'ACTIVE' | 'INACTIVE';
}

export default function WarehousesPage() {
    const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    // Form create
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editAddress, setEditAddress] = useState('');
    const [editStatus, setEditStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        const res = await getWarehousesAction();
        if (res.success && res.data) {
            setWarehouses(res.data as unknown as WarehouseItem[]);
        } else {
            setError(res.error || 'Gagal memuat gudang');
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setMessage(null);
        setSubmitting(true);
        const res = await createWarehouseAction({ code, name, address });
        setSubmitting(false);
        if (res.success) {
            setMessage(res.message || 'Gudang berhasil dibuat');
            setCode('');
            setName('');
            setAddress('');
            loadData();
        } else {
            setError(res.error || 'Gagal membuat gudang');
        }
    }

    async function handleUpdate(id: string) {
        setError(null);
        setMessage(null);
        const res = await updateWarehouseAction(id, {
            name: editName,
            address: editAddress,
            status: editStatus,
        });
        if (res.success) {
            setMessage(res.message || 'Gudang berhasil diperbarui');
            setEditingId(null);
            loadData();
        } else {
            setError(res.error || 'Gagal memperbarui gudang');
        }
    }

    async function handleDelete(id: string, whName: string) {
        if (!confirm(`Yakin ingin menonaktifkan gudang "${whName}"?`)) return;
        setError(null);
        setMessage(null);
        const res = await deleteWarehouseAction(id);
        if (res.success) {
            setMessage(res.message || 'Gudang berhasil dinonaktifkan');
            loadData();
        } else {
            setError(res.error || 'Gagal menghapus gudang');
        }
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
            <PageHeader
                title="Master Fasilitas Gudang"
                subtitle="Daftar lokasi gedung penyimpanan logistik fisik dan hub operasional."
                icon={Warehouse}
                badge={{ label: 'ADMINISTRATOR', variant: 'admin' }}
                breadcrumbs={[
                    { label: 'StockFlow', href: '/' },
                    { label: 'Master Data' },
                    { label: 'Gudang (Warehouse)' },
                ]}
            />

            {error && (
                <div className="flex items-center gap-2.5 p-3.5 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200/80 rounded-xl animate-fade-in">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                    <span>{error}</span>
                </div>
            )}

            {message && (
                <div className="flex items-center gap-2.5 p-3.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/80 rounded-xl animate-fade-in">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{message}</span>
                </div>
            )}

            {/* Create Form */}
            <FormCard
                title="Tambah Gudang Baru"
                description="Daftarkan fasilitas gudang baru beserta alamat fisik."
                icon={Plus}
                footer={
                    <Button
                        type="submit"
                        form="create-warehouse-form"
                        disabled={submitting}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 rounded-xl shadow-sm"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                Menyimpan...
                            </>
                        ) : (
                            <>
                                <Plus className="h-3.5 w-3.5 mr-1.5" />
                                Simpan Gudang
                            </>
                        )}
                    </Button>
                }
            >
                <form id="create-warehouse-form" onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="wh-code">Kode Gudang *</Label>
                        <Input
                            id="wh-code"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="WH-JKT-01"
                            required
                            className="text-xs uppercase font-mono h-9 rounded-xl"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="wh-name">Nama Gudang *</Label>
                        <Input
                            id="wh-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Gudang Utama Jakarta"
                            required
                            className="text-xs h-9 rounded-xl"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="wh-address">Alamat / Lokasi</Label>
                        <Input
                            id="wh-address"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Jl. Raya Cakung KM 2..."
                            className="text-xs h-9 rounded-xl"
                        />
                    </div>
                </form>
            </FormCard>

            {/* Warehouse Table */}
            <DataTable
                title="Daftar Fasilitas Gudang"
                description="Semua gedung gudang aktif yang beroperasi."
                badgeCount={warehouses.length}
                dataLength={warehouses.length}
                emptyTitle="Belum Ada Gudang"
                emptyDescription="Tambahkan fasilitas gudang pertama menggunakan formulir di atas."
                emptyIcon={Warehouse}
            >
                <Table>
                    <TableHeader className="bg-slate-50/75">
                        <TableRow>
                            <TableHead className="w-[180px] text-xs font-bold text-slate-700">KODE GUDANG</TableHead>
                            <TableHead className="text-xs font-bold text-slate-700">NAMA GUDANG</TableHead>
                            <TableHead className="text-xs font-bold text-slate-700">ALAMAT FISIK</TableHead>
                            <TableHead className="w-[130px] text-xs font-bold text-slate-700">STATUS</TableHead>
                            <TableHead className="w-[130px] text-right text-xs font-bold text-slate-700">AKSI</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-xs text-slate-500">
                                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-indigo-600" />
                                    Memuat daftar gudang...
                                </TableCell>
                            </TableRow>
                        ) : (
                            warehouses.map((w) => (
                                <TableRow key={w._id} className="hover:bg-slate-50/50 transition-colors">
                                    {editingId === w._id ? (
                                        <>
                                            <TableCell className="font-mono text-xs font-bold text-slate-900">
                                                {w.code}
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    className="text-xs h-8 rounded-lg"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    value={editAddress}
                                                    onChange={(e) => setEditAddress(e.target.value)}
                                                    className="text-xs h-8 rounded-lg"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <select
                                                    value={editStatus}
                                                    onChange={(e) =>
                                                        setEditStatus(e.target.value as 'ACTIVE' | 'INACTIVE')
                                                    }
                                                    className="text-xs border rounded-lg px-2 h-8 bg-white"
                                                >
                                                    <option value="ACTIVE">ACTIVE</option>
                                                    <option value="INACTIVE">INACTIVE</option>
                                                </select>
                                            </TableCell>
                                            <TableCell className="text-right space-x-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleUpdate(w._id)}
                                                    className="h-8 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                >
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setEditingId(null)}
                                                    className="h-8 px-2 text-slate-500 hover:bg-slate-100"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </>
                                    ) : (
                                        <>
                                            <TableCell className="font-mono text-xs font-bold text-indigo-700">
                                                {w.code}
                                            </TableCell>
                                            <TableCell className="text-xs font-semibold text-slate-800">
                                                {w.name}
                                            </TableCell>
                                            <TableCell className="text-xs text-slate-500">
                                                {w.address || '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        w.status === 'ACTIVE'
                                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 text-[11px]'
                                                            : 'border-slate-200 bg-slate-50 text-slate-500 text-[11px]'
                                                    }
                                                >
                                                    <StatusDot
                                                        variant={w.status === 'ACTIVE' ? 'success' : 'neutral'}
                                                        size="sm"
                                                        className="mr-1.5"
                                                    />
                                                    {w.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right space-x-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setEditingId(w._id);
                                                        setEditName(w.name);
                                                        setEditAddress(w.address || '');
                                                        setEditStatus(w.status);
                                                    }}
                                                    className="h-8 px-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
                                                    title="Edit Gudang"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleDelete(w._id, w.name)}
                                                    className="h-8 px-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50"
                                                    title="Nonaktifkan Gudang"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </TableCell>
                                        </>
                                    )}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </DataTable>
        </div>
    );
}
