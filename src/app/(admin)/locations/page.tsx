'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    getLocationsAction,
    createLocationAction,
    updateLocationAction,
    deleteLocationAction,
} from '@/actions/LocationActions';
import { getWarehousesAction } from '@/actions/WarehouseActions';
import { LocationType } from '@/models/LocationModel';
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
    MapPin,
    Plus,
    Check,
    X,
    Pencil,
    Trash2,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Filter,
} from 'lucide-react';

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
        if (!confirm(`Yakin ingin menonaktifkan lokasi "${locCode}"?`)) return;
        setError(null);
        setMessage(null);
        const res = await deleteLocationAction(id);
        if (res.success) {
            setMessage(res.message || 'Lokasi berhasil dinonaktifkan');
            loadLocations();
        } else {
            setError(res.error || 'Gagal menghapus lokasi');
        }
    }

    function getWarehouseName(wId: string) {
        const found = warehouses.find((w) => w._id === wId);
        return found ? `${found.name} (${found.code})` : wId;
    }

    const getLocationTypeBadge = (t: LocationType) => {
        switch (t) {
            case 'STORAGE':
                return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'RECEIVING':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'SHIPPING':
                return 'bg-purple-50 text-purple-700 border-purple-200';
            case 'STAGING':
                return 'bg-amber-50 text-amber-700 border-amber-200';
            default:
                return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
            <PageHeader
                title="Master Zona & Rak Lokasi"
                subtitle="Pemetaan rak, bin, receiving dock, dan staging area di seluruh gudang."
                icon={MapPin}
                badge={{ label: 'ADMINISTRATOR', variant: 'admin' }}
                breadcrumbs={[
                    { label: 'StockFlow', href: '/' },
                    { label: 'Master Data' },
                    { label: 'Lokasi & Zona' },
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
                title="Tambah Lokasi / Zona Baru"
                description="Tentukan kode rak, nama area, gudang induk, dan fungsi operasional."
                icon={Plus}
                footer={
                    <Button
                        type="submit"
                        form="create-location-form"
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
                                Simpan Lokasi
                            </>
                        )}
                    </Button>
                }
            >
                <form id="create-location-form" onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="loc-warehouse">Fasilitas Gudang *</Label>
                        <select
                            id="loc-warehouse"
                            value={warehouseId}
                            onChange={(e) => setWarehouseId(e.target.value)}
                            required
                            className="w-full text-xs h-9 rounded-xl border border-input bg-background px-3"
                        >
                            <option value="">Pilih Gudang...</option>
                            {warehouses.map((w) => (
                                <option key={w._id} value={w._id}>
                                    {w.name} ({w.code})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="loc-code">Kode Lokasi *</Label>
                        <Input
                            id="loc-code"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="RACK-A01"
                            required
                            className="text-xs uppercase font-mono h-9 rounded-xl"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="loc-name">Nama Lokasi *</Label>
                        <Input
                            id="loc-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Rak A Lantai 1"
                            required
                            className="text-xs h-9 rounded-xl"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="loc-type">Tipe Zona Operasional *</Label>
                        <select
                            id="loc-type"
                            value={type}
                            onChange={(e) => setType(e.target.value as LocationType)}
                            className="w-full text-xs h-9 rounded-xl border border-input bg-background px-3"
                        >
                            <option value="STORAGE">STORAGE (Penyimpanan)</option>
                            <option value="RECEIVING">RECEIVING (Penerimaan)</option>
                            <option value="SHIPPING">SHIPPING (Pengeluaran)</option>
                            <option value="STAGING">STAGING (Transit)</option>
                        </select>
                    </div>
                </form>
            </FormCard>

            {/* Locations Table */}
            <DataTable
                title="Katalog Lokasi & Zona"
                description="Pemetaan seluruh titik penyimpanan dalam fasilitas gudang."
                badgeCount={locations.length}
                dataLength={locations.length}
                emptyTitle="Belum Ada Lokasi"
                emptyDescription="Tambahkan lokasi rak/zona pertama menggunakan formulir di atas."
                emptyIcon={MapPin}
                actions={
                    <div className="flex items-center gap-2">
                        <Filter className="h-3.5 w-3.5 text-slate-400" />
                        <select
                            value={selectedWarehouseFilter}
                            onChange={(e) => setSelectedWarehouseFilter(e.target.value)}
                            className="text-xs h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-slate-700"
                        >
                            <option value="">Semua Gudang</option>
                            {warehouses.map((w) => (
                                <option key={w._id} value={w._id}>
                                    {w.name} ({w.code})
                                </option>
                            ))}
                        </select>
                    </div>
                }
            >
                <Table>
                    <TableHeader className="bg-slate-50/75">
                        <TableRow>
                            <TableHead className="text-xs font-bold text-slate-700">GUDANG</TableHead>
                            <TableHead className="w-[160px] text-xs font-bold text-slate-700">KODE</TableHead>
                            <TableHead className="text-xs font-bold text-slate-700">NAMA LOKASI</TableHead>
                            <TableHead className="w-[130px] text-xs font-bold text-slate-700">TIPE ZONA</TableHead>
                            <TableHead className="w-[120px] text-xs font-bold text-slate-700">STATUS</TableHead>
                            <TableHead className="w-[130px] text-right text-xs font-bold text-slate-700">AKSI</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-xs text-slate-500">
                                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-indigo-600" />
                                    Memuat daftar lokasi...
                                </TableCell>
                            </TableRow>
                        ) : (
                            locations.map((loc) => (
                                <TableRow key={loc._id} className="hover:bg-slate-50/50 transition-colors">
                                    {editingId === loc._id ? (
                                        <>
                                            <TableCell className="text-xs text-slate-500">
                                                {getWarehouseName(loc.warehouseId)}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs font-bold text-slate-900">
                                                {loc.code}
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
                                                    value={editType}
                                                    onChange={(e) => setEditType(e.target.value as LocationType)}
                                                    className="text-xs border rounded-lg px-2 h-8 bg-white"
                                                >
                                                    <option value="STORAGE">STORAGE</option>
                                                    <option value="RECEIVING">RECEIVING</option>
                                                    <option value="SHIPPING">SHIPPING</option>
                                                    <option value="STAGING">STAGING</option>
                                                </select>
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
                                                    onClick={() => handleUpdate(loc._id)}
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
                                            <TableCell className="text-xs text-slate-600 font-medium">
                                                {getWarehouseName(loc.warehouseId)}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs font-bold text-indigo-700">
                                                {loc.code}
                                            </TableCell>
                                            <TableCell className="text-xs font-semibold text-slate-800">
                                                {loc.name}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[10px] font-semibold uppercase ${getLocationTypeBadge(loc.type)}`}
                                                >
                                                    {loc.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        loc.status === 'ACTIVE'
                                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 text-[11px]'
                                                            : 'border-slate-200 bg-slate-50 text-slate-500 text-[11px]'
                                                    }
                                                >
                                                    <StatusDot
                                                        variant={loc.status === 'ACTIVE' ? 'success' : 'neutral'}
                                                        size="sm"
                                                        className="mr-1.5"
                                                    />
                                                    {loc.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right space-x-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setEditingId(loc._id);
                                                        setEditName(loc.name);
                                                        setEditType(loc.type);
                                                        setEditStatus(loc.status);
                                                    }}
                                                    className="h-8 px-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
                                                    title="Edit Lokasi"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleDelete(loc._id, loc.code)}
                                                    className="h-8 px-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50"
                                                    title="Nonaktifkan Lokasi"
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
