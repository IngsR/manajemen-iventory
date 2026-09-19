'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    getUnitsAction,
    createUnitAction,
    updateUnitAction,
    deleteUnitAction,
} from '@/actions/UnitActions';

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
            setMessage(res.message || 'Satuan berhasil dihapus');
            loadData();
        } else {
            setError(res.error || 'Gagal menghapus satuan');
        }
    }

    return (
        <main className="max-w-4xl mx-auto p-6">
            <div className="flex items-center justify-between border-b pb-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Master Data Satuan (Unit)</h1>
                    <p className="text-gray-600 text-sm">Standar satuan pengukuran barang persediaan</p>
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
                <h2 className="font-semibold text-gray-800">Tambah Satuan Baru</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Kode Satuan *</label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="Contoh: PCS, BOX, KG"
                            required
                            className="w-full border rounded px-3 py-1.5 text-sm uppercase font-mono"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Nama Satuan Lengkap *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Contoh: Pieces, Karton, Kilogram"
                            required
                            className="w-full border rounded px-3 py-1.5 text-sm"
                        />
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={submitting}
                    className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                    {submitting ? 'Menyimpan...' : 'Simpan Satuan'}
                </button>
            </form>

            {/* Table */}
            <div className="border rounded overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-100 border-b">
                        <tr>
                            <th className="p-3 font-semibold">Kode Satuan</th>
                            <th className="p-3 font-semibold">Nama Satuan</th>
                            <th className="p-3 font-semibold">Status</th>
                            <th className="p-3 font-semibold text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="p-4 text-center text-gray-500">
                                    Memuat data satuan...
                                </td>
                            </tr>
                        ) : units.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="p-4 text-center text-gray-500">
                                    Belum ada satuan terdaftar.
                                </td>
                            </tr>
                        ) : (
                            units.map((u) => (
                                <tr key={u._id} className="hover:bg-gray-50">
                                    {editingId === u._id ? (
                                        <>
                                            <td className="p-3 font-mono font-bold text-gray-700">{u.code}</td>
                                            <td className="p-3">
                                                <input
                                                    type="text"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
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
                                                    onClick={() => handleUpdate(u._id)}
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
                                            <td className="p-3 font-mono font-medium text-gray-900">{u.code}</td>
                                            <td className="p-3 font-medium">{u.name}</td>
                                            <td className="p-3">
                                                <span
                                                    className={`px-2 py-0.5 text-xs rounded font-medium ${
                                                        u.status === 'ACTIVE'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-gray-100 text-gray-700'
                                                    }`}
                                                >
                                                    {u.status}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right space-x-3">
                                                <button
                                                    onClick={() => {
                                                        setEditingId(u._id);
                                                        setEditName(u.name);
                                                        setEditStatus(u.status);
                                                    }}
                                                    className="text-blue-600 hover:underline"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(u._id, u.code)}
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
