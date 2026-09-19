'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    getLocationsAction,
    createLocationAction,
    updateLocationAction,
    deleteLocationAction,
} from '@/actions/LocationActions';
import { getWarehousesAction } from '@/actions/WarehouseActions';
import { LocationType } from '@/models/LocationModel';

interface LocationItem {
    _id: string;
    warehouseId: string;
    code: string;
    name: string;
    type: LocationType;
    status: 'ACTIVE' | 'INACTIVE';
}

interface WarehouseOption {
    _id: string;
    code: string;
    name: string;
}

export default function LocationsPage() {
    const [locations, setLocations] = useState<LocationItem[]>([]);
    const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
    const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    // Form create
    const [warehouseId, setWarehouseId] = useState('');
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [type, setType] = useState<LocationType>('STORAGE');
    const [submitting, setSubmitting] = useState(false);

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editType, setEditType] = useState<LocationType>('STORAGE');
    const [editStatus, setEditStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

    const loadWarehouses = useCallback(async () => {
        const res = await getWarehousesAction();
        if (res.success && res.data) {
            setWarehouses(res.data as unknown as WarehouseOption[]);
        }
    }, []);

    const loadLocations = useCallback(async () => {
        setLoading(true);
        setError(null);
        const res = await getLocationsAction(selectedWarehouseFilter || undefined);
        if (res.success && res.data) {
            setLocations(res.data as unknown as LocationItem[]);
        } else {
            setError(res.error || 'Gagal memuat lokasi');
        }
        setLoading(false);
    }, [selectedWarehouseFilter]);

    useEffect(() => {
        loadWarehouses();
    }, [loadWarehouses]);

    useEffect(() => {
        loadLocations();
    }, [loadLocations]);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setMessage(null);
        setSubmitting(true);
        const res = await createLocationAction({ warehouseId, code, name, type });
        setSubmitting(false);
        if (res.success) {
            setMessage(res.message || 'Lokasi berhasil dibuat');
            setCode('');
            setName('');
            loadLocations();
        } else {
            setError(res.error || 'Gagal membuat lokasi');
        }
    }

    async function handleUpdate(id: string) {
        setError(null);
        setMessage(null);
        const res = await updateLocationAction(id, {
            name: editName,
            type: editType,
            status: editStatus,
        });
        if (res.success) {
            setMessage(res.message || 'Lokasi berhasil diperbarui');
            setEditingId(null);
            loadLocations();
        } else {
            setError(res.error || 'Gagal memperbarui lokasi');
        }
    }

    async function handleDelete(id: string, locCode: string) {
        if (!confirm(`Yakin ingin menghapus / menonaktifkan lokasi "${locCode}"?`)) return;
        setError(null);
        setMessage(null);
        const res = await deleteLocationAction(id);
        if (res.success) {
            setMessage(res.message || 'Lokasi berhasil dihapus');
            loadLocations();
        } else {
            setError(res.error || 'Gagal menghapus lokasi');
        }
    }

    function getWarehouseName(wId: string) {
        const found = warehouses.find((w) => w._id === wId);
        return found ? `${found.name} (${found.code})` : wId;
    }

    return (
        <main className="max-w-4xl mx-auto p-6">
            <div className="flex items-center justify-between border-b pb-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Master Data Lokasi (Location)</h1>
                    <p className="text-gray-600 text-sm">Rak, bin, staging area, dan zona fisik dalam gudang</p>
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
                <h2 className="font-semibold text-gray-800">Tambah Lokasi Baru</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Gudang *</label>
                        <select
                            value={warehouseId}
                            onChange={(e) => setWarehouseId(e.target.value)}
                            required
                            className="w-full border rounded px-3 py-1.5 text-sm bg-white"
                        >
                            <option value="">Pilih Gudang...</option>
                            {warehouses.map((w) => (
                                <option key={w._id} value={w._id}>
                                    {w.name} ({w.code})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Kode Lokasi *</label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="Contoh: RACK-A01"
                            required
                            className="w-full border rounded px-3 py-1.5 text-sm uppercase font-mono"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Nama Lokasi *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Contoh: Rak A Lantai 1"
                            required
                            className="w-full border rounded px-3 py-1.5 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Tipe Zona *</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value as LocationType)}
                            className="w-full border rounded px-3 py-1.5 text-sm bg-white"
                        >
                            <option value="STORAGE">STORAGE (Penyimpanan)</option>
                            <option value="RECEIVING">RECEIVING (Penerimaan)</option>
                            <option value="SHIPPING">SHIPPING (Pengeluaran)</option>
                            <option value="STAGING">STAGING (Transit)</option>
                        </select>
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={submitting}
                    className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                    {submitting ? 'Menyimpan...' : 'Simpan Lokasi'}
                </button>
            </form>

            {/* Filter Bar */}
            <div className="mb-4 flex items-center gap-2">
                <label className="text-xs font-medium text-gray-600">Filter Gudang:</label>
                <select
                    value={selectedWarehouseFilter}
                    onChange={(e) => setSelectedWarehouseFilter(e.target.value)}
                    className="border rounded px-3 py-1 text-sm bg-white"
                >
                    <option value="">Semua Gudang</option>
                    {warehouses.map((w) => (
                        <option key={w._id} value={w._id}>
                            {w.name} ({w.code})
                        </option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="border rounded overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-100 border-b">
                        <tr>
                            <th className="p-3 font-semibold">Gudang</th>
                            <th className="p-3 font-semibold">Kode</th>
                            <th className="p-3 font-semibold">Nama Lokasi</th>
                            <th className="p-3 font-semibold">Tipe</th>
                            <th className="p-3 font-semibold">Status</th>
                            <th className="p-3 font-semibold text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="p-4 text-center text-gray-500">
                                    Memuat data lokasi...
                                </td>
                            </tr>
                        ) : locations.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-4 text-center text-gray-500">
                                    Belum ada lokasi terdaftar untuk gudang ini.
                                </td>
                            </tr>
                        ) : (
                            locations.map((loc) => (
                                <tr key={loc._id} className="hover:bg-gray-50">
                                    {editingId === loc._id ? (
                                        <>
                                            <td className="p-3 text-gray-600 text-xs">
                                                {getWarehouseName(loc.warehouseId)}
                                            </td>
                                            <td className="p-3 font-mono font-bold text-gray-700">{loc.code}</td>
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
                                                    value={editType}
                                                    onChange={(e) => setEditType(e.target.value as LocationType)}
                                                    className="border rounded px-2 py-1 text-sm"
                                                >
                                                    <option value="STORAGE">STORAGE</option>
                                                    <option value="RECEIVING">RECEIVING</option>
                                                    <option value="SHIPPING">SHIPPING</option>
                                                    <option value="STAGING">STAGING</option>
                                                </select>
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
                                                    onClick={() => handleUpdate(loc._id)}
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
                                            <td className="p-3 text-gray-600 text-xs">
                                                {getWarehouseName(loc.warehouseId)}
                                            </td>
                                            <td className="p-3 font-mono font-medium text-gray-900">{loc.code}</td>
                                            <td className="p-3 font-medium">{loc.name}</td>
                                            <td className="p-3 text-xs">
                                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
                                                    {loc.type}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                <span
                                                    className={`px-2 py-0.5 text-xs rounded font-medium ${
                                                        loc.status === 'ACTIVE'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-gray-100 text-gray-700'
                                                    }`}
                                                >
                                                    {loc.status}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right space-x-3">
                                                <button
                                                    onClick={() => {
                                                        setEditingId(loc._id);
                                                        setEditName(loc.name);
                                                        setEditType(loc.type);
                                                        setEditStatus(loc.status);
                                                    }}
                                                    className="text-blue-600 hover:underline"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(loc._id, loc.code)}
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
