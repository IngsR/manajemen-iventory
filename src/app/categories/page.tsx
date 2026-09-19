'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    getCategoriesAction,
    createCategoryAction,
    updateCategoryAction,
    deleteCategoryAction,
} from '@/actions/CategoryActions';

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
            setMessage(res.message || 'Kategori berhasil dibuat');
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
        if (!confirm(`Yakin ingin menghapus / menonaktifkan kategori "${catName}"?`)) return;
        setError(null);
        setMessage(null);
        const res = await deleteCategoryAction(id);
        if (res.success) {
            setMessage(res.message || 'Kategori berhasil dihapus');
            loadData();
        } else {
            setError(res.error || 'Gagal menghapus kategori');
        }
    }

    return (
        <main className="max-w-4xl mx-auto p-6">
            <div className="flex items-center justify-between border-b pb-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Master Data Kategori</h1>
                    <p className="text-gray-600 text-sm">Klasifikasi barang dalam persediaan gudang</p>
                </div>
                <Link href="/" className="text-sm text-blue-600 hover:underline">
                    &larr; Kembali ke Menu
                </Link>
            </div>

            {error && (
                <div className="p-3 mb-4 bg-red-100 text-red-700 rounded border border-red-200 text-sm">
                    {error}
                </div>
            )}
            {message && (
                <div className="p-3 mb-4 bg-green-100 text-green-700 rounded border border-green-200 text-sm">
                    {message}
                </div>
            )}

            {/* Create Form */}
            <form onSubmit={handleCreate} className="p-4 border rounded bg-gray-50 mb-6 space-y-3">
                <h2 className="font-semibold text-gray-800">Tambah Kategori Baru</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Kode Kategori *</label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="Contoh: ELEKTRONIK"
                            required
                            className="w-full border rounded px-3 py-1.5 text-sm uppercase"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Nama Kategori *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Contoh: Peralatan Elektronik"
                            required
                            className="w-full border rounded px-3 py-1.5 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Deskripsi</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Opsional..."
                            className="w-full border rounded px-3 py-1.5 text-sm"
                        />
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={submitting}
                    className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                    {submitting ? 'Menyimpan...' : 'Simpan Kategori'}
                </button>
            </form>

            {/* Table */}
            <div className="border rounded overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-100 border-b">
                        <tr>
                            <th className="p-3 font-semibold">Kode</th>
                            <th className="p-3 font-semibold">Nama</th>
                            <th className="p-3 font-semibold">Deskripsi</th>
                            <th className="p-3 font-semibold">Status</th>
                            <th className="p-3 font-semibold text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="p-4 text-center text-gray-500">
                                    Memuat data kategori...
                                </td>
                            </tr>
                        ) : categories.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-4 text-center text-gray-500">
                                    Belum ada kategori terdaftar.
                                </td>
                            </tr>
                        ) : (
                            categories.map((c) => (
                                <tr key={c._id} className="hover:bg-gray-50">
                                    {editingId === c._id ? (
                                        <>
                                            <td className="p-3 font-mono font-bold text-gray-700">{c.code}</td>
                                            <td className="p-3">
                                                <input
                                                    type="text"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    className="border rounded px-2 py-1 text-sm w-full"
                                                />
                                            </td>
                                            <td className="p-3">
                                                <input
                                                    type="text"
                                                    value={editDesc}
                                                    onChange={(e) => setEditDesc(e.target.value)}
                                                    className="border rounded px-2 py-1 text-sm w-full"
                                                />
                                            </td>
                                            <td className="p-3">
                                                <select
                                                    value={editStatus}
                                                    onChange={(e) =>
                                                        setEditStatus(e.target.value as 'ACTIVE' | 'INACTIVE')
                                                    }
                                                    className="border rounded px-2 py-1 text-sm"
                                                >
                                                    <option value="ACTIVE">ACTIVE</option>
                                                    <option value="INACTIVE">INACTIVE</option>
                                                </select>
                                            </td>
                                            <td className="p-3 text-right space-x-2">
                                                <button
                                                    onClick={() => handleUpdate(c._id)}
                                                    className="text-green-600 font-semibold hover:underline"
                                                >
                                                    Simpan
                                                </button>
                                                <button
                                                    onClick={() => setEditingId(null)}
                                                    className="text-gray-500 hover:underline"
                                                >
                                                    Batal
                                                </button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="p-3 font-mono font-medium text-gray-900">{c.code}</td>
                                            <td className="p-3 font-medium">{c.name}</td>
                                            <td className="p-3 text-gray-600">{c.description || '-'}</td>
                                            <td className="p-3">
                                                <span
                                                    className={`px-2 py-0.5 text-xs rounded font-medium ${
                                                        c.status === 'ACTIVE'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-gray-100 text-gray-700'
                                                    }`}
                                                >
                                                    {c.status}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right space-x-3">
                                                <button
                                                    onClick={() => {
                                                        setEditingId(c._id);
                                                        setEditName(c.name);
                                                        setEditDesc(c.description || '');
                                                        setEditStatus(c.status);
                                                    }}
                                                    className="text-blue-600 hover:underline"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(c._id, c.name)}
                                                    className="text-red-600 hover:underline"
                                                >
                                                    Hapus
                                                </button>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </main>
    );
}
