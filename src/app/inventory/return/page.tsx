'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { returnStockAction } from '@/actions/ReturnStockAction';
import { getItemsAction, PopulatedItem } from '@/actions/ItemActions';
import { getLocationsAction } from '@/actions/LocationActions';
import { LocationDoc } from '@/models/LocationModel';

interface Result {
    movementNumber: string;
    stockBefore: number;
    stockAfter: number;
    message: string;
}

export default function ReturnPage() {
    const [items, setItems] = useState<PopulatedItem[]>([]);
    const [locations, setLocations] = useState<LocationDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<Result | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        Promise.all([getItemsAction(), getLocationsAction()]).then(([itemRes, locRes]) => {
            if (itemRes.success && itemRes.data) setItems(itemRes.data.filter(i => i.status === 'ACTIVE'));
            if (locRes.success && locRes.data) setLocations(locRes.data.filter(l => l.status === 'ACTIVE'));
            setLoading(false);
        });
    }, []);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setSubmitting(true);
        setResult(null);
        setError(null);

        const fd = new FormData(e.currentTarget);
        const res = await returnStockAction(fd);

        if (res.success && res.data) {
            setResult(res.data);
            (e.target as HTMLFormElement).reset();
        } else {
            setError(res.error || 'Terjadi kesalahan');
        }
        setSubmitting(false);
    }

    if (loading) return <div className="max-w-2xl mx-auto p-6 text-gray-500">Memuat data...</div>;

    return (
        <main className="max-w-2xl mx-auto p-6">
            <div className="flex items-center gap-3 mb-6">
                <Link href="/" className="text-blue-600 hover:underline text-sm">← Beranda</Link>
                <span className="text-gray-400">/</span>
                <h1 className="text-xl font-bold">Return Stock (Pengembalian Barang)</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Barang *</label>
                    <select name="itemId" required className="w-full border rounded px-3 py-2 text-sm">
                        <option value="">-- Pilih Barang --</option>
                        {items.map(i => (
                            <option key={String(i._id)} value={String(i._id)}>
                                [{i.sku}] {i.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi Pengembalian *</label>
                    <select name="locationId" required className="w-full border rounded px-3 py-2 text-sm">
                        <option value="">-- Pilih Lokasi --</option>
                        {locations.map(l => (
                            <option key={String(l._id)} value={String(l._id)}>
                                [{l.code}] {l.name} ({l.type})
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah *</label>
                    <input
                        name="quantity"
                        type="number"
                        min="1"
                        step="1"
                        required
                        className="w-full border rounded px-3 py-2 text-sm"
                        placeholder="0"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Referensi</label>
                    <input
                        name="referenceNumber"
                        type="text"
                        className="w-full border rounded px-3 py-2 text-sm"
                        placeholder="RTN-001, dll"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
                    <input name="reason" type="text" className="w-full border rounded px-3 py-2 text-sm" placeholder="Alasan pengembalian" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Petugas *</label>
                        <input name="actorName" type="text" required className="w-full border rounded px-3 py-2 text-sm" placeholder="Nama lengkap" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                        <select name="actorRole" required className="w-full border rounded px-3 py-2 text-sm">
                            <option value="Petugas">Petugas</option>
                            <option value="Supervisor">Supervisor</option>
                            <option value="Admin">Admin</option>
                        </select>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded transition disabled:opacity-50"
                >
                    {submitting ? 'Memproses...' : 'Proses Pengembalian'}
                </button>
            </form>

            {result && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="font-semibold text-green-700">✓ Berhasil</p>
                    <p className="text-sm text-gray-700 mt-1">{result.message}</p>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-center text-sm">
                        <div className="bg-white border rounded p-2">
                            <p className="text-gray-500">Stok Sebelum</p>
                            <p className="text-lg font-bold">{result.stockBefore}</p>
                        </div>
                        <div className="bg-white border rounded p-2">
                            <p className="text-gray-500">+Dikembalikan</p>
                            <p className="text-lg font-bold text-purple-600">+{result.stockAfter - result.stockBefore}</p>
                        </div>
                        <div className="bg-white border rounded p-2">
                            <p className="text-gray-500">Stok Sekarang</p>
                            <p className="text-lg font-bold text-purple-700">{result.stockAfter}</p>
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Movement: {result.movementNumber}</p>
                </div>
            )}

            {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="font-semibold text-red-700">✗ Gagal</p>
                    <p className="text-sm text-red-600 mt-1">{error}</p>
                </div>
            )}
        </main>
    );
}
