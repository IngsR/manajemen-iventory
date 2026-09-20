'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    getUnitsAction,
    createUnitAction,
    updateUnitAction,
    deleteUnitAction,
} from '@/actions/UnitActions';
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
    Ruler,
    Plus,
    Check,
    X,
    Pencil,
    Trash2,
    Loader2,
    CheckCircle2,
    AlertCircle,
} from 'lucide-react';

interface UnitItem {
    _id: string;
    code: string;
    name: string;
    status: 'ACTIVE' | 'INACTIVE';
}

export default function UnitsPage() {
    const [units, setUnits] = useState<UnitItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    // Form create
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editStatus, setEditStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        const res = await getUnitsAction();
        if (res.success && res.data) {
            setUnits(res.data as unknown as UnitItem[]);
        } else {
            setError(res.error || 'Gagal memuat satuan');
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
        const res = await createUnitAction({ code, name });
        setSubmitting(false);
        if (res.success) {
            setMessage(res.message || 'Satuan berhasil dibuat');
            setCode('');
            setName('');
            loadData();
        } else {
            setError(res.error || 'Gagal membuat satuan');
        }
    }

    async function handleUpdate(id: string) {
        setError(null);
        setMessage(null);
        const res = await updateUnitAction(id, {
            name: editName,
            status: editStatus,
        });
        if (res.success) {
            setMessage(res.message || 'Satuan berhasil diperbarui');
            setEditingId(null);
            loadData();
        } else {
            setError(res.error || 'Gagal memperbarui satuan');
        }
    }

    async function handleDelete(id: string, unitCode: string) {
        if (!confirm(`Yakin ingin menghapus / menonaktifkan satuan "${unitCode}"?`)) return;
        setError(null);
        setMessage(null);
        const res = await deleteUnitAction(id);
        if (res.success) {
            setMessage(res.message || 'Satuan berhasil dinonaktifkan');
            loadData();
        } else {
            setError(res.error || 'Gagal menghapus satuan');
        }
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
            <PageHeader
                title="Master Satuan Ukuran (Units)"
                subtitle="Standarisasi satuan kuantitas persediaan dan penimbangan inventaris gudang."
                icon={Ruler}
                badge={{ label: 'ADMINISTRATOR', variant: 'admin' }}
                breadcrumbs={[
                    { label: 'StockFlow', href: '/' },
                    { label: 'Master Data' },
                    { label: 'Satuan (Unit)' },
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
                title="Tambah Satuan Baru"
                description="Daftarkan kode dan nama satuan baru (misalnya PCS, BOX, KG)."
                icon={Plus}
                footer={
                    <Button
                        type="submit"
                        form="create-unit-form"
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
                                Simpan Satuan
                            </>
                        )}
                    </Button>
                }
            >
                <form id="create-unit-form" onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="unit-code">Kode Satuan *</Label>
                        <Input
                            id="unit-code"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="PCS / BOX / KG"
                            required
                            className="text-xs uppercase font-mono h-9 rounded-xl"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="unit-name">Nama Satuan Lengkap *</Label>
                        <Input
                            id="unit-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Pieces / Karton / Kilogram"
                            required
                            className="text-xs h-9 rounded-xl"
                        />
                    </div>
                </form>
            </FormCard>

            {/* Units Data Table */}
            <DataTable
                title="Daftar Satuan Terdaftar"
                description="Satuan yang tersedia untuk konfigurasi barang dan konversi."
                badgeCount={units.length}
                dataLength={units.length}
                emptyTitle="Belum Ada Satuan"
                emptyDescription="Tambahkan satuan unit pertama menggunakan formulir di atas."
                emptyIcon={Ruler}
            >
                <Table>
                    <TableHeader className="bg-slate-50/75">
                        <TableRow>
                            <TableHead className="w-[180px] text-xs font-bold text-slate-700">KODE SATUAN</TableHead>
                            <TableHead className="text-xs font-bold text-slate-700">NAMA SATUAN</TableHead>
                            <TableHead className="w-[140px] text-xs font-bold text-slate-700">STATUS</TableHead>
                            <TableHead className="w-[130px] text-right text-xs font-bold text-slate-700">AKSI</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-xs text-slate-500">
                                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-indigo-600" />
                                    Memuat daftar satuan...
                                </TableCell>
                            </TableRow>
                        ) : (
                            units.map((u) => (
                                <TableRow key={u._id} className="hover:bg-slate-50/50 transition-colors">
                                    {editingId === u._id ? (
                                        <>
                                            <TableCell className="font-mono text-xs font-bold text-slate-900">
                                                {u.code}
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
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
                                                    onClick={() => handleUpdate(u._id)}
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
                                                {u.code}
                                            </TableCell>
                                            <TableCell className="text-xs font-semibold text-slate-800">
                                                {u.name}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        u.status === 'ACTIVE'
                                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 text-[11px]'
                                                            : 'border-slate-200 bg-slate-50 text-slate-500 text-[11px]'
                                                    }
                                                >
                                                    <StatusDot
                                                        variant={u.status === 'ACTIVE' ? 'success' : 'neutral'}
                                                        size="sm"
                                                        className="mr-1.5"
                                                    />
                                                    {u.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right space-x-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setEditingId(u._id);
                                                        setEditName(u.name);
                                                        setEditStatus(u.status);
                                                    }}
                                                    className="h-8 px-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
                                                    title="Edit Satuan"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleDelete(u._id, u.code)}
                                                    className="h-8 px-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50"
                                                    title="Nonaktifkan Satuan"
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
