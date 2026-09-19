'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    getWarehousesAction,
    createWarehouseAction,
    updateWarehouseAction,
    deleteWarehouseAction,
} from '@/actions/WarehouseActions';

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
        if (!confirm(`Yakin ingin menghapus / menonaktifkan gudang "${whName}"?`)) return;
        setError(null);
        setMessage(null);
        const res = await deleteWarehouseAction(id);
        if (res.success) {
            setMessage(res.message || 'Gudang berhasil dihapus');
            loadData();
        } else {
            setError(res.error || 'Gagal menghapus gudang');
        }
    }

    return (
        <main className="max-w-4xl mx-auto p-6">
            <div className="flex items-center justify-between border-b pb-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Master Data Gudang (Warehouse)</h1>
                    <p className="text-gray-600 text-sm">Fasilitas penyimpanan fisik persediaan</p>
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
                <h2 className="font-semibold text-gray-800">Tambah Gudang Baru</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Kode Gudang *</label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="Contoh: WH-JKT-01"
                            required
                            className="w-full border rounded px-3 py-1.5 text-sm uppercase font-mono"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Nama Gudang *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Contoh: Gudang Utama Jakarta"
                            required
                            className="w-full border rounded px-3 py-1.5 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Alamat / Lokasi</label>
                        <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
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
                    {submitting ? 'Menyimpan...' : 'Simpan Gudang'}
                </button>
            </form>

            {/* Table */}
            <div className="border rounded overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-100 border-b">
                        <tr>
                            <th className="p-3 font-semibold">Kode</th>
                            <th className="p-3 font-semibold">Nama Gudang</th>
                            <th className="p-3 font-semibold">Alamat</th>
                            <th className="p-3 font-semibold">Status</th>
                            <th className="p-3 font-semibold text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="p-4 text-center text-gray-500">
                                    Memuat data gudang...
                                </td>
                            </tr>
                        ) : warehouses.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-4 text-center text-gray-500">
                                    Belum ada gudang terdaftar.
                                </td>
                            </tr>
                        ) : (
                            warehouses.map((w) => (
                                <tr key={w._id} className="hover:bg-gray-50">
                                    {editingId === w._id ? (
                                        <>
                                            <td className="p-3 font-mono font-bold text-gray-700">{w.code}</td>
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
                                                    value={editAddress}
                                                    onChange={(e) => setEditAddress(e.target.value)}
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
                                                    onClick={() => handleUpdate(w._id)}
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
                                            <td className="p-3 font-mono font-medium text-gray-900">{w.code}</td>
                                            <td className="p-3 font-medium">{w.name}</td>
                                            <td className="p-3 text-gray-600">{w.address || '-'}</td>
                                            <td className="p-3">
                                                <span
                                                    className={`px-2 py-0.5 text-xs rounded font-medium ${
                                                        w.status === 'ACTIVE'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-gray-100 text-gray-700'
                                                    }`}
                                                >
                                                    {w.status}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right space-x-3">
                                                <button
                                                    onClick={() => {
                                                        setEditingId(w._id);
                                                        setEditName(w.name);
                                                        setEditAddress(w.address || '');
                                                        setEditStatus(w.status);
                                                    }}
                                                    className="text-blue-600 hover:underline"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(w._id, w.name)}
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
