'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    getItemsAction,
    createItemAction,
    updateItemAction,
    deleteItemAction,
    PopulatedItem,
} from '@/actions/ItemActions';
import { getCategoriesAction } from '@/actions/CategoryActions';
import { getUnitsAction } from '@/actions/UnitActions';
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
    Package,
    Plus,
    Check,
    X,
    Pencil,
    Trash2,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Layers,
    Sparkles,
} from 'lucide-react';

interface OptionItem {
    _id: string;
    code: string;
    name: string;
}

export default function ItemsPage() {
    const [items, setItems] = useState<PopulatedItem[]>([]);
    const [categories, setCategories] = useState<OptionItem[]>([]);
    const [units, setUnits] = useState<OptionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    // Form create
    const [sku, setSku] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [unitId, setUnitId] = useState('');
    const [minStock, setMinStock] = useState('0');
    const [submitting, setSubmitting] = useState(false);

    function handleGenerateSku() {
        const cat = categories.find((c) => c._id === categoryId);
        const prefix = cat ? cat.code.toUpperCase() : 'SKU';
        const rand = Math.floor(100 + Math.random() * 900);
        setSku(`${prefix}-${rand}`);
    }

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editCatId, setEditCatId] = useState('');
    const [editUnitId, setEditUnitId] = useState('');
    const [editMinStock, setEditMinStock] = useState('0');
    const [editStatus, setEditStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

    const loadOptions = useCallback(async () => {
        const [catRes, unitRes] = await Promise.all([
            getCategoriesAction(),
            getUnitsAction(),
        ]);
        if (catRes.success && catRes.data) {
            setCategories(catRes.data as unknown as OptionItem[]);
        }
        if (unitRes.success && unitRes.data) {
            setUnits(unitRes.data as unknown as OptionItem[]);
        }
    }, []);

    const loadItems = useCallback(async () => {
        setLoading(true);
        setError(null);
        const res = await getItemsAction();
        if (res.success && res.data) {
            setItems(res.data);
        } else {
            setError(res.error || 'Gagal memuat daftar barang');
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        loadOptions();
        loadItems();
    }, [loadOptions, loadItems]);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setMessage(null);
        setSubmitting(true);
        const res = await createItemAction({
            sku,
            name,
            description,
            categoryId,
            unitId,
            minStock: Number(minStock) || 0,
        });
        setSubmitting(false);
        if (res.success) {
            setMessage(res.message || 'Barang berhasil didaftarkan');
            setSku('');
            setName('');
            setDescription('');
            setMinStock('0');
            loadItems();
        } else {
            setError(res.error || 'Gagal membuat barang');
        }
    }

    async function handleUpdate(id: string) {
        setError(null);
        setMessage(null);
        const res = await updateItemAction(id, {
            name: editName,
            description: editDesc,
            categoryId: editCatId,
            unitId: editUnitId,
            minStock: Number(editMinStock) || 0,
            status: editStatus,
        });
        if (res.success) {
            setMessage(res.message || 'Barang berhasil diperbarui');
            setEditingId(null);
            loadItems();
        } else {
            setError(res.error || 'Gagal memperbarui barang');
        }
    }

    async function handleDelete(id: string, itemName: string, itemSku: string) {
        if (!confirm(`Yakin ingin menonaktifkan barang "${itemName}" (${itemSku})?`)) return;
        setError(null);
        setMessage(null);
        const res = await deleteItemAction(id);
        if (res.success) {
            setMessage(res.message || 'Barang berhasil dinonaktifkan');
            loadItems();
        } else {
            setError(res.error || 'Gagal menghapus barang');
        }
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
            <PageHeader
                title="Master Barang & SKU Produk"
                subtitle="Daftar katalog material, produk jadi, suku cadang, dan batas safety stock."
                icon={Package}
                badge={{ label: 'ADMINISTRATOR', variant: 'admin' }}
                breadcrumbs={[
                    { label: 'StockFlow', href: '/' },
                    { label: 'Master Data' },
                    { label: 'Barang & SKU' },
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

            {/* Create Item Form */}
            <FormCard
                title="Daftarkan Barang / SKU Baru"
                description="Lengkapi kode unik SKU, nama komoditas, kategori, dan batas minimum pengingat stok."
                icon={Plus}
                footer={
                    <Button
                        type="submit"
                        form="create-item-form"
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
                                Simpan Barang Baru
                            </>
                        )}
                    </Button>
                }
            >
                <form id="create-item-form" onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="item-sku">SKU Unik *</Label>
                            <button
                                type="button"
                                onClick={handleGenerateSku}
                                className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1 font-medium"
                                title="Buat kode SKU otomatis berdasarkan kategori"
                            >
                                <Sparkles className="h-3 w-3" /> Auto SKU
                            </button>
                        </div>
                        <Input
                            id="item-sku"
                            value={sku}
                            onChange={(e) => setSku(e.target.value)}
                            placeholder="SKU-LAP-001"
                            required
                            className="text-xs uppercase font-mono h-9 rounded-xl"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="item-name">Nama Barang *</Label>
                        <Input
                            id="item-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Laptop ThinkPad T14 Gen 4"
                            required
                            className="text-xs h-9 rounded-xl"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="item-category">Kategori *</Label>
                        <select
                            id="item-category"
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            required
                            className="w-full text-xs h-9 rounded-xl border border-input bg-background px-3"
                        >
                            <option value="">Pilih Kategori...</option>
                            {categories.map((c) => (
                                <option key={c._id} value={c._id}>
                                    {c.name} ({c.code})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="item-unit">Satuan (Unit) *</Label>
                        <select
                            id="item-unit"
                            value={unitId}
                            onChange={(e) => setUnitId(e.target.value)}
                            required
                            className="w-full text-xs h-9 rounded-xl border border-input bg-background px-3"
                        >
                            <option value="">Pilih Satuan...</option>
                            {units.map((u) => (
                                <option key={u._id} value={u._id}>
                                    {u.name} ({u.code})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="item-min-stock">Batas Minimum Stock (Safety)</Label>
                        <Input
                            id="item-min-stock"
                            type="number"
                            min="0"
                            value={minStock}
                            onChange={(e) => setMinStock(e.target.value)}
                            className="text-xs h-9 rounded-xl font-mono"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="item-desc">Deskripsi Tambahan</Label>
                        <Input
                            id="item-desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Spesifikasi / catatan..."
                            className="text-xs h-9 rounded-xl"
                        />
                    </div>
                </form>
            </FormCard>

            {/* Items Data Table */}
            <DataTable
                title="Katalog Inventaris SKU"
                description="Semua item terdaftar dalam basis data sistem."
                badgeCount={items.length}
                dataLength={items.length}
                emptyTitle="Belum Ada Barang"
                emptyDescription="Daftarkan SKU komoditas pertama menggunakan formulir di atas."
                emptyIcon={Layers}
            >
                <Table>
                    <TableHeader className="bg-slate-50/75">
                        <TableRow>
                            <TableHead className="w-[150px] text-xs font-bold text-slate-700">KODE SKU</TableHead>
                            <TableHead className="text-xs font-bold text-slate-700">NAMA PRODUK</TableHead>
                            <TableHead className="w-[140px] text-xs font-bold text-slate-700">KATEGORI</TableHead>
                            <TableHead className="w-[110px] text-xs font-bold text-slate-700">SATUAN</TableHead>
                            <TableHead className="w-[110px] text-xs font-bold text-slate-700 text-center">MIN STOK</TableHead>
                            <TableHead className="w-[120px] text-xs font-bold text-slate-700">STATUS</TableHead>
                            <TableHead className="w-[120px] text-right text-xs font-bold text-slate-700">AKSI</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-xs text-slate-500">
                                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-indigo-600" />
                                    Memuat katalog barang...
                                </TableCell>
                            </TableRow>
                        ) : (
                            items.map((it) => {
                                const itId = String(it._id);
                                return (
                                    <TableRow key={itId} className="hover:bg-slate-50/50 transition-colors">
                                        {editingId === itId ? (
                                            <>
                                                <TableCell className="font-mono text-xs font-bold text-slate-900">
                                                    {it.sku}
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        className="text-xs h-8 rounded-lg mb-1"
                                                    />
                                                    <Input
                                                        value={editDesc}
                                                        onChange={(e) => setEditDesc(e.target.value)}
                                                        placeholder="Deskripsi..."
                                                        className="text-[11px] h-7 rounded-lg text-slate-500"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <select
                                                        value={editCatId}
                                                        onChange={(e) => setEditCatId(e.target.value)}
                                                        className="text-xs border rounded-lg px-2 h-8 bg-white w-full"
                                                    >
                                                        {categories.map((c) => (
                                                            <option key={c._id} value={c._id}>
                                                                {c.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </TableCell>
                                                <TableCell>
                                                    <select
                                                        value={editUnitId}
                                                        onChange={(e) => setEditUnitId(e.target.value)}
                                                        className="text-xs border rounded-lg px-2 h-8 bg-white w-full"
                                                    >
                                                        {units.map((u) => (
                                                            <option key={u._id} value={u._id}>
                                                                {u.code}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        value={editMinStock}
                                                        onChange={(e) => setEditMinStock(e.target.value)}
                                                        className="text-xs h-8 rounded-lg w-16 mx-auto text-center font-mono"
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
                                                        onClick={() => handleUpdate(itId)}
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
                                                    {it.sku}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-xs font-semibold text-slate-900">
                                                        {it.name}
                                                    </div>
                                                    {it.description && (
                                                        <span className="text-[11px] text-slate-400 line-clamp-1">
                                                            {it.description}
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-xs font-medium text-slate-700">
                                                        {it.categoryName || '-'}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-xs font-mono font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                                                        {it.unitCode || it.unitName || '-'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="text-xs font-mono font-semibold text-slate-700">
                                                        {it.minStock}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            it.status === 'ACTIVE'
                                                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 text-[11px]'
                                                                : 'border-slate-200 bg-slate-50 text-slate-500 text-[11px]'
                                                        }
                                                    >
                                                        <StatusDot
                                                            variant={it.status === 'ACTIVE' ? 'success' : 'neutral'}
                                                            size="sm"
                                                            className="mr-1.5"
                                                        />
                                                        {it.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right space-x-1">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setEditingId(itId);
                                                            setEditName(it.name);
                                                            setEditDesc(it.description || '');
                                                            setEditCatId(String(it.categoryId));
                                                            setEditUnitId(String(it.unitId));
                                                            setEditMinStock(String(it.minStock));
                                                            setEditStatus(it.status);
                                                        }}
                                                        className="h-8 px-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
                                                        title="Edit Barang"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleDelete(itId, it.name, it.sku)}
                                                        className="h-8 px-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50"
                                                        title="Nonaktifkan Barang"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </TableCell>
                                            </>
                                        )}
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </DataTable>
        </div>
    );
}
