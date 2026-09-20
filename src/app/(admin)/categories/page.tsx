'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    getCategoriesAction,
    createCategoryAction,
    updateCategoryAction,
    deleteCategoryAction,
} from '@/actions/CategoryActions';
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
    Tags,
    Plus,
    Check,
    X,
    Pencil,
    Trash2,
    Loader2,
    CheckCircle2,
    AlertCircle,
} from 'lucide-react';

interface CategoryItem {
    _id: string;
    code: string;
    name: string;
    description?: string;
    status: 'ACTIVE' | 'INACTIVE';
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<CategoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    // Form state for creating
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editStatus, setEditStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        const res = await getCategoriesAction();
        if (res.success && res.data) {
            setCategories(res.data as unknown as CategoryItem[]);
        } else {
            setError(res.error || 'Gagal memuat kategori');
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
        const res = await createCategoryAction({ code, name, description });
        setSubmitting(false);
        if (res.success) {
            setMessage(res.message || 'Kategori berhasil ditambahkan');
            setCode('');
            setName('');
            setDescription('');
            loadData();
        } else {
            setError(res.error || 'Gagal membuat kategori');
        }
    }

    async function handleUpdate(id: string) {
        setError(null);
        setMessage(null);
        const res = await updateCategoryAction(id, {
            name: editName,
            description: editDesc,
            status: editStatus,
        });
        if (res.success) {
            setMessage(res.message || 'Kategori berhasil diperbarui');
            setEditingId(null);
            loadData();
        } else {
            setError(res.error || 'Gagal memperbarui kategori');
        }
    }

    async function handleDelete(id: string, catName: string) {
        if (!confirm(`Yakin ingin menonaktifkan kategori "${catName}"?`)) return;
        setError(null);
        setMessage(null);
        const res = await deleteCategoryAction(id);
        if (res.success) {
            setMessage(res.message || 'Kategori berhasil dinonaktifkan');
            loadData();
        } else {
            setError(res.error || 'Gagal menghapus kategori');
        }
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
            <PageHeader
                title="Master Kategori Barang"
                subtitle="Klasifikasi dan segmentasi katalog barang untuk tata kelola inventaris."
                icon={Tags}
                badge={{ label: 'ADMINISTRATOR', variant: 'admin' }}
                breadcrumbs={[
                    { label: 'StockFlow', href: '/' },
                    { label: 'Master Data' },
                    { label: 'Kategori' },
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

            {/* Create Category Card */}
            <FormCard
                title="Tambah Kategori Baru"
                description="Buat kode dan nama klasifikasi barang baru."
                icon={Plus}
                footer={
                    <Button
                        type="submit"
                        form="create-category-form"
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
                                Simpan Kategori
                            </>
                        )}
                    </Button>
                }
            >
                <form id="create-category-form" onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="cat-code">Kode Kategori *</Label>
                        <Input
                            id="cat-code"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="ELEKTRONIK"
                            required
                            className="text-xs uppercase font-mono h-9 rounded-xl"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="cat-name">Nama Kategori *</Label>
                        <Input
                            id="cat-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Peralatan Elektronik"
                            required
                            className="text-xs h-9 rounded-xl"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="cat-desc">Deskripsi</Label>
                        <Input
                            id="cat-desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Keterangan singkat..."
                            className="text-xs h-9 rounded-xl"
                        />
                    </div>
                </form>
            </FormCard>

            {/* Data Table */}
            <DataTable
                title="Daftar Kategori Terdaftar"
                description="Katalog klasifikasi produk yang saat ini tercatat di database."
                badgeCount={categories.length}
                dataLength={categories.length}
                emptyTitle="Belum Ada Kategori"
                emptyDescription="Tambahkan kategori pertama menggunakan formulir di atas."
                emptyIcon={Tags}
            >
                <Table>
                    <TableHeader className="bg-slate-50/75">
                        <TableRow>
                            <TableHead className="w-[180px] text-xs font-bold text-slate-700">KODE</TableHead>
                            <TableHead className="text-xs font-bold text-slate-700">NAMA KATEGORI</TableHead>
                            <TableHead className="text-xs font-bold text-slate-700">DESKRIPSI</TableHead>
                            <TableHead className="w-[120px] text-xs font-bold text-slate-700">STATUS</TableHead>
                            <TableHead className="w-[130px] text-right text-xs font-bold text-slate-700">AKSI</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-xs text-slate-500">
                                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-indigo-600" />
                                    Memuat daftar kategori...
                                </TableCell>
                            </TableRow>
                        ) : (
                            categories.map((c) => (
                                <TableRow key={c._id} className="hover:bg-slate-50/50 transition-colors">
                                    {editingId === c._id ? (
                                        <>
                                            <TableCell className="font-mono text-xs font-bold text-slate-900">
                                                {c.code}
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
                                                    value={editDesc}
                                                    onChange={(e) => setEditDesc(e.target.value)}
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
                                                    onClick={() => handleUpdate(c._id)}
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
                                                {c.code}
                                            </TableCell>
                                            <TableCell className="text-xs font-semibold text-slate-800">
                                                {c.name}
                                            </TableCell>
                                            <TableCell className="text-xs text-slate-500">
                                                {c.description || '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        c.status === 'ACTIVE'
                                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 text-[11px]'
                                                            : 'border-slate-200 bg-slate-50 text-slate-500 text-[11px]'
                                                    }
                                                >
                                                    <StatusDot
                                                        variant={c.status === 'ACTIVE' ? 'success' : 'neutral'}
                                                        size="sm"
                                                        className="mr-1.5"
                                                    />
                                                    {c.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right space-x-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setEditingId(c._id);
                                                        setEditName(c.name);
                                                        setEditDesc(c.description || '');
                                                        setEditStatus(c.status);
                                                    }}
                                                    className="h-8 px-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
                                                    title="Edit Kategori"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleDelete(c._id, c.name)}
                                                    className="h-8 px-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50"
                                                    title="Nonaktifkan Kategori"
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
