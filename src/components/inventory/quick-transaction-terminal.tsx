'use client';

import React, { useState, useEffect } from 'react';
import { receiveStockAction, ReceiveStockResult } from '@/actions/ReceiveStockAction';
import { issueStockAction, IssueStockResult } from '@/actions/IssueStockAction';
import { getItemsAction, PopulatedItem } from '@/actions/ItemActions';
import { getLocationsAction } from '@/actions/LocationActions';
import { LocationDoc } from '@/models/LocationModel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    ArrowDownToLine,
    ArrowUpFromLine,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Zap,
    RotateCcw,
    Sparkles,
    Boxes,
    PackageCheck,
    PackageMinus,
} from 'lucide-react';

export function QuickTransactionTerminal() {
    const [mode, setMode] = useState<'RECEIVE' | 'ISSUE'>('RECEIVE');
    const [items, setItems] = useState<PopulatedItem[]>([]);
    const [locations, setLocations] = useState<LocationDoc[]>([]);
    const [loadingMaster, setLoadingMaster] = useState(true);

    // Form inputs
    const [selectedItemId, setSelectedItemId] = useState('');
    const [selectedLocationId, setSelectedLocationId] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [referenceNumber, setReferenceNumber] = useState('');
    const [partnerName, setPartnerName] = useState('');

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [receipt, setReceipt] = useState<{
        movementNumber: string;
        itemName: string;
        sku: string;
        locationName: string;
        quantity: number;
        stockAfter: number;
        type: 'RECEIVE' | 'ISSUE';
    } | null>(null);

    useEffect(() => {
        Promise.all([getItemsAction(), getLocationsAction()]).then(([itemRes, locRes]) => {
            if (itemRes.success && itemRes.data) {
                const activeItems = itemRes.data.filter((i) => i.status === 'ACTIVE');
                setItems(activeItems);
            }
            if (locRes.success && locRes.data) {
                const activeLocs = (locRes.data as unknown as LocationDoc[]).filter(
                    (l) => l.status === 'ACTIVE'
                );
                setLocations(activeLocs);
            }
            setLoadingMaster(false);
        });
    }, []);

    // Generate auto reference number based on mode and date
    function handleGenerateRef(currentMode = mode) {
        const prefix = currentMode === 'RECEIVE' ? 'RCV' : 'ISS';
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const rand = Math.floor(1000 + Math.random() * 9000);
        setReferenceNumber(`${prefix}-${dateStr}-${rand}`);
    }

    // Auto-select location when item changes if location not yet selected
    function handleItemChange(itemId: string) {
        setSelectedItemId(itemId);
        if (!selectedLocationId && locations.length > 0) {
            setSelectedLocationId(String(locations[0]._id));
        }
    }

    function switchMode(newMode: 'RECEIVE' | 'ISSUE') {
        setMode(newMode);
        setError(null);
        setReceipt(null);
        handleGenerateRef(newMode);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setReceipt(null);

        const qtyNum = parseInt(quantity, 10);
        if (!selectedItemId || !selectedLocationId || isNaN(qtyNum) || qtyNum <= 0) {
            setError('Pilih barang, lokasi, dan masukkan jumlah > 0.');
            return;
        }

        setSubmitting(true);
        const fd = new FormData();
        fd.append('itemId', selectedItemId);
        fd.append('locationId', selectedLocationId);
        fd.append('quantity', String(qtyNum));
        fd.append('referenceNumber', referenceNumber || `${mode}-${Date.now()}`);

        if (mode === 'RECEIVE') {
            fd.append('supplierName', partnerName || 'Supplier Umum');
            fd.append('notes', 'Transaksi cepat via Terminal Petugas');
            const res = await receiveStockAction(fd);
            setSubmitting(false);

            if (res.success && res.data) {
                const selItem = items.find((i) => String(i._id) === selectedItemId);
                const selLoc = locations.find((l) => String(l._id) === selectedLocationId);
                setReceipt({
                    movementNumber: res.data.movementNumber,
                    itemName: selItem?.name || 'Barang',
                    sku: selItem?.sku || '',
                    locationName: selLoc?.name || 'Gudang',
                    quantity: qtyNum,
                    stockAfter: res.data.stockAfter,
                    type: 'RECEIVE',
                });
                setQuantity('1');
                handleGenerateRef('RECEIVE');
            } else {
                setError(res.error || 'Gagal memproses penerimaan.');
            }
        } else {
            fd.append('recipientName', partnerName || 'Divisi Pemohon');
            fd.append('notes', 'Transaksi cepat via Terminal Petugas');
            const res = await issueStockAction(fd);
            setSubmitting(false);

            if (res.success && res.data) {
                const selItem = items.find((i) => String(i._id) === selectedItemId);
                const selLoc = locations.find((l) => String(l._id) === selectedLocationId);
                setReceipt({
                    movementNumber: res.data.movementNumber,
                    itemName: selItem?.name || 'Barang',
                    sku: selItem?.sku || '',
                    locationName: selLoc?.name || 'Gudang',
                    quantity: qtyNum,
                    stockAfter: res.data.stockAfter,
                    type: 'ISSUE',
                });
                setQuantity('1');
                handleGenerateRef('ISSUE');
            } else {
                setError(res.error || 'Gagal memproses pengeluaran stok.');
            }
        }
    }

    if (loadingMaster) {
        return (
            <div className="glass-card rounded-2xl p-6 border-slate-200/80 flex items-center justify-center gap-3 text-xs text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                <span>Menyiapkan Terminal Cepat Transaksi...</span>
            </div>
        );
    }

    return (
        <div className="glass-card rounded-2xl p-5 sm:p-6 border-emerald-200/80 relative overflow-hidden bg-gradient-to-r from-emerald-50/20 via-white to-white shadow-sm">
            {/* Header with Mode Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                        <Zap className="h-4 w-4" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 text-base tracking-tight flex items-center gap-2">
                            Terminal Transaksi Cepat
                            <Badge variant="outline" className="text-[10px] uppercase font-mono border-emerald-200 text-emerald-700 bg-emerald-50">
                                1-Step Execution
                            </Badge>
                        </h3>
                        <p className="text-xs text-slate-500">
                            Catat mutasi barang masuk atau keluar langsung tanpa berpindah halaman
                        </p>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex rounded-xl bg-slate-100 p-1 self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={() => switchMode('RECEIVE')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            mode === 'RECEIVE'
                                ? 'bg-white text-emerald-700 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <ArrowDownToLine className="h-3.5 w-3.5" />
                        Penerimaan (Inbound)
                    </button>
                    <button
                        type="button"
                        onClick={() => switchMode('ISSUE')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            mode === 'ISSUE'
                                ? 'bg-white text-orange-700 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <ArrowUpFromLine className="h-3.5 w-3.5" />
                        Pengeluaran (Outbound)
                    </button>
                </div>
            </div>

            {/* Error Notification */}
            {error && (
                <div className="mb-4 flex items-center gap-2 p-3 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200/80 rounded-xl animate-fade-in">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                    <span>{error}</span>
                </div>
            )}

            {/* Success Receipt Banner */}
            {receipt && (
                <div className="mb-4 p-4 rounded-xl border border-emerald-200 bg-emerald-50/80 text-emerald-900 animate-scale-in">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                            <div>
                                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                                    Transaksi Berhasil Dicatat: {receipt.movementNumber}
                                </span>
                                <div className="text-xs text-emerald-700">
                                    {receipt.type === 'RECEIVE' ? 'Masuk' : 'Keluar'} <strong>{receipt.quantity} unit</strong> [{receipt.sku}] {receipt.itemName} pada lokasi <strong>{receipt.locationName}</strong>.
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-[11px] text-emerald-600 block">Saldo Baru Lokasi:</span>
                            <span className="font-mono text-base font-extrabold text-emerald-900">{receipt.stockAfter} unit</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Fast Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Item SKU */}
                    <div className="space-y-1">
                        <Label htmlFor="fast-item" className="text-xs font-semibold text-slate-700">
                            Barang / SKU *
                        </Label>
                        <select
                            id="fast-item"
                            value={selectedItemId}
                            onChange={(e) => handleItemChange(e.target.value)}
                            required
                            className="w-full text-xs h-9 rounded-xl border border-input bg-background px-3 focus-visible:ring-1 focus-visible:ring-emerald-500"
                        >
                            <option value="">-- Pilih Barang SKU --</option>
                            {items.map((i) => (
                                <option key={String(i._id)} value={String(i._id)}>
                                    [{i.sku}] {i.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Location */}
                    <div className="space-y-1">
                        <Label htmlFor="fast-loc" className="text-xs font-semibold text-slate-700">
                            Lokasi / Rak Gudang *
                        </Label>
                        <select
                            id="fast-loc"
                            value={selectedLocationId}
                            onChange={(e) => setSelectedLocationId(e.target.value)}
                            required
                            className="w-full text-xs h-9 rounded-xl border border-input bg-background px-3 focus-visible:ring-1 focus-visible:ring-emerald-500"
                        >
                            <option value="">-- Pilih Lokasi --</option>
                            {locations.map((l) => (
                                <option key={String(l._id)} value={String(l._id)}>
                                    [{l.code}] {l.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Quantity with Quick Chips */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="fast-qty" className="text-xs font-semibold text-slate-700">
                                Kuantitas (Unit) *
                            </Label>
                            <div className="flex gap-1">
                                {[1, 5, 10, 50].map((step) => (
                                    <button
                                        key={step}
                                        type="button"
                                        onClick={() => setQuantity(String(step))}
                                        className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-mono"
                                    >
                                        +{step}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <Input
                            id="fast-qty"
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            required
                            className="h-9 text-xs rounded-xl font-mono font-bold"
                        />
                    </div>

                    {/* Partner / Reference */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="fast-partner" className="text-xs font-semibold text-slate-700">
                                {mode === 'RECEIVE' ? 'Vendor / Supplier' : 'Pemohon / Divisi'}
                            </Label>
                            <button
                                type="button"
                                onClick={() => handleGenerateRef()}
                                className="text-[10px] text-emerald-700 hover:underline flex items-center gap-0.5"
                                title="Generate nomor referensi otomatis"
                            >
                                <Sparkles className="h-2.5 w-2.5" /> Auto Ref
                            </button>
                        </div>
                        <Input
                            id="fast-partner"
                            placeholder={mode === 'RECEIVE' ? 'PT Supplier Logistik' : 'Divisi Gudang / Produksi'}
                            value={partnerName}
                            onChange={(e) => setPartnerName(e.target.value)}
                            className="h-9 text-xs rounded-xl"
                        />
                    </div>
                </div>

                {/* Submit Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-slate-400">
                            Ref: {referenceNumber || '(Auto-generated saat kirim)'}
                        </span>
                    </div>

                    <Button
                        type="submit"
                        disabled={submitting}
                        className={`text-xs h-9 px-6 rounded-xl font-bold shadow-sm text-white ${
                            mode === 'RECEIVE'
                                ? 'bg-emerald-600 hover:bg-emerald-700'
                                : 'bg-orange-600 hover:bg-orange-700'
                        }`}
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                Memproses...
                            </>
                        ) : mode === 'RECEIVE' ? (
                            <>
                                <PackageCheck className="h-3.5 w-3.5 mr-1.5" />
                                Eksekusi Penerimaan Stok
                            </>
                        ) : (
                            <>
                                <PackageMinus className="h-3.5 w-3.5 mr-1.5" />
                                Eksekusi Pengeluaran Stok
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
