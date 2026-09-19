'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    getItemsAction,
    createItemAction,
    updateItemAction,
    deleteItemAction,
    PopulatedItem,
} from '@/actions/ItemActions';
import { getCategoriesAction } from '@/actions/CategoryActions';
import { getUnitsAction } from '@/actions/UnitActions';

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
        if (!confirm(`Yakin ingin menghapus / menonaktifkan barang "${itemName}" (${itemSku})?`)) return;
        setError(null);
        setMessage(null);
        const res = await deleteItemAction(id);
        if (res.success) {
            setMessage(res.message || 'Barang berhasil diproses');
            loadItems();
        } else {
            setError(res.error || 'Gagal menghapus barang');
        }
    }

    return (
        <main className="max-w-5xl mx-auto p-6">
            <div className="flex items-center justify-between border-b pb-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Master Data Barang &amp; SKU (Item)</h1>
                    <p className="text-gray-600 text-sm">Entitas barang dan identitas SKU inventaris gudang</p>
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
                <h2 className="font-semibold text-gray-800">Daftarkan Barang / SKU Baru</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">SKU Unik *</label>
                        <input
                            type="text"
                            value={sku}
                            onChange={(e) => setSku(e.target.value)}
                            placeholder="Contoh: SKU-LAP-001"
                            required
                            className="w-full border rounded px-3 py-1.5 text-sm uppercase font-mono"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Nama Barang *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Contoh: Laptop ThinkPad T14"
                            required
                            className="w-full border rounded px-3 py-1.5 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Kategori *</label>
                        <select
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            required
                            className="w-full border rounded px-3 py-1.5 text-sm bg-white"
                        >
                            <option value="">Pilih Kategori...</option>
                            {categories.map((c) => (
                                <option key={c._id} value={c._id}>
                                    {c.name} ({c.code})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Satuan (Unit) *</label>
                        <select
                            value={unitId}
                            onChange={(e) => setUnitId(e.target.value)}
                            required
                            className="w-full border rounded px-3 py-1.5 text-sm bg-white"
                        >
                            <option value="">Pilih Satuan...</option>
                            {units.map((u) => (
                                <option key={u._id} value={u._id}>
                                    {u.name} ({u.code})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Batas Min. Stock</label>
                        <input
                            type="number"
                            min="0"
                            value={minStock}
                            onChange={(e) => setMinStock(e.target.value)}
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
                    {submitting ? 'Menyimpan...' : 'Simpan Barang'}
                </button>
            </form>

            {/* Table */}
            <div className="border rounded overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-100 border-b">
                        <tr>
                            <th className="p-3 font-semibold">SKU</th>
                            <th className="p-3 font-semibold">Nama Barang</th>
                            <th className="p-3 font-semibold">Kategori</th>
                            <th className="p-3 font-semibold">Satuan</th>
                            <th className="p-3 font-semibold">Min Stock</th>
                            <th className="p-3 font-semibold">Status</th>
                            <th className="p-3 font-semibold text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="p-4 text-center text-gray-500">
                                    Memuat data barang...
                                </td>
                            </tr>
                        ) : items.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-4 text-center text-gray-500">
                                    Belum ada barang / SKU terdaftar.
                                </td>
                            </tr>
                        ) : (
                            items.map((it) => {
                                const itId = String(it._id);
                                return (
                                    <tr key={itId} className="hover:bg-gray-50">
                                        {editingId === itId ? (
                                            <>
                                                <td className="p-3 font-mono font-bold text-gray-700">{it.sku}</td>
                                                <td className="p-3">
                                                    <input
                                                        type="text"
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        className="border rounded px-2 py-1 text-sm w-full mb-1"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={editDesc}
                                                        onChange={(e) => setEditDesc(e.target.value)}
                                                        placeholder="Deskripsi..."
                                                        className="border rounded px-2 py-0.5 text-xs w-full text-gray-600"
                                                    />
                                                </td>
                                                <td className="p-3">
                                                    <select
                                                        value={editCatId}
                                                        onChange={(e) => setEditCatId(e.target.value)}
                                                        className="border rounded px-2 py-1 text-xs"
                                                    >
                                                        {categories.map((c) => (
                                                            <option key={c._id} value={c._id}>
                                                                {c.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="p-3">
                                                    <select
                                                        value={editUnitId}
                                                        onChange={(e) => setEditUnitId(e.target.value)}
                                                        className="border rounded px-2 py-1 text-xs"
                                                    >
                                                        {units.map((u) => (
                                                            <option key={u._id} value={u._id}>
                                                                {u.code}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="p-3">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={editMinStock}
                                                        onChange={(e) => setEditMinStock(e.target.value)}
                                                        className="border rounded px-2 py-1 text-sm w-16"
                                                    />
                                                </td>
                                                <td className="p-3">
                                                    <select
                                                        value={editStatus}
                                                        onChange={(e) =>
                                                            setEditStatus(e.target.value as 'ACTIVE' | 'INACTIVE')
                                                        }
                                                        className="border rounded px-2 py-1 text-xs"
                                                    >
                                                        <option value="ACTIVE">ACTIVE</option>
                                                        <option value="INACTIVE">INACTIVE</option>
                                                    </select>
                                                </td>
                                                <td className="p-3 text-right space-x-2">
                                                    <button
                                                        onClick={() => handleUpdate(itId)}
                                                        className="text-green-600 font-semibold hover:underline text-xs"
                                                    >
                                                        Simpan
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingId(null)}
                                                        className="text-gray-500 hover:underline text-xs"
                                                    >
                                                        Batal
                                                    </button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="p-3 font-mono font-medium text-gray-900">{it.sku}</td>
                                                <td className="p-3 font-medium">
                                                    {it.name}
                                                    {it.description && (
                                                        <span className="block text-xs text-gray-500 font-normal">
                                                            {it.description}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-gray-700">{it.categoryName || '-'}</td>
                                                <td className="p-3 text-gray-700">
                                                    {it.unitCode || it.unitName || '-'}
                                                </td>
                                                <td className="p-3 font-mono text-gray-600">{it.minStock}</td>
                                                <td className="p-3">
                                                    <span
                                                        className={`px-2 py-0.5 text-xs rounded font-medium ${
                                                            it.status === 'ACTIVE'
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-gray-100 text-gray-700'
                                                        }`}
                                                    >
                                                        {it.status}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-right space-x-3">
                                                    <button
                                                        onClick={() => {
                                                            setEditingId(itId);
                                                            setEditName(it.name);
                                                            setEditDesc(it.description || '');
                                                            setEditCatId(String(it.categoryId));
                                                            setEditUnitId(String(it.unitId));
                                                            setEditMinStock(String(it.minStock));
                                                            setEditStatus(it.status);
                                                        }}
                                                        className="text-blue-600 hover:underline"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(itId, it.name, it.sku)}
                                                        className="text-red-600 hover:underline"
                                                    >
                                                        Hapus
                                                    </button>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </main>
    );
}
