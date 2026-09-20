'use client';

import { useState, useEffect } from 'react';
import { transferStockAction, TransferStockResult } from '@/actions/TransferStockAction';
import { getItemsAction, PopulatedItem } from '@/actions/ItemActions';
import { getLocationsAction } from '@/actions/LocationActions';
import { LocationDoc } from '@/models/LocationModel';
import { PageHeader } from '@/components/shared/PageHeader';
import { FormCard } from '@/components/shared/FormCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    ArrowLeftRight,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Boxes,
    ArrowRight,
} from 'lucide-react';

export default function TransferPage() {
    const [items, setItems] = useState<PopulatedItem[]>([]);
    const [locations, setLocations] = useState<LocationDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<TransferStockResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        Promise.all([getItemsAction(), getLocationsAction()]).then(([itemRes, locRes]) => {
            if (itemRes.success && itemRes.data) {
                setItems(itemRes.data.filter(i => i.status === 'ACTIVE'));
            }
            if (locRes.success && locRes.data) {
                setLocations((locRes.data as unknown as LocationDoc[]).filter(l => l.status === 'ACTIVE'));
            }
            setLoading(false);
        });
    }, []);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setSubmitting(true);
        setResult(null);
        setError(null);

        const formElement = e.currentTarget;
        const fd = new FormData(formElement);
        const res = await transferStockAction(fd);

        if (res.success && res.data) {
            setResult(res.data);
            formElement.reset();
        } else {
            setError(res.error || 'Terjadi kesalahan');
        }
        setSubmitting(false);
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[300px] text-xs text-slate-500">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600 mb-2" />
                <span>Memuat data master transfer...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
            <PageHeader
                title="Transfer Antar Lokasi (Relocation)"
                subtitle="Pindahkan stok barang dari satu titik rak/zona gudang ke titik lainnya secara atomik."
                icon={ArrowLeftRight}
                badge={{ label: 'OPERASIONAL', variant: 'petugas' }}
                breadcrumbs={[
                    { label: 'StockFlow', href: '/' },
                    { label: 'Transaksi Stok' },
                    { label: 'Transfer Lokasi' },
                ]}
            />

            {error && (
                <div className="flex items-center gap-2.5 p-3.5 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200/80 rounded-xl animate-fade-in">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                    <span>{error}</span>
                </div>
            )}

            <FormCard
                title="Formulir Pemindahan Barang Antar Rak"
                description="Mutasi akan mengurangi stok lokasi asal dan menambah stok lokasi tujuan dalam satu transaksi atomik."
                icon={Boxes}
                footer={
                    <Button
                        type="submit"
                        form="transfer-form"
                        disabled={submitting}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 rounded-xl shadow-sm px-5"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                Memproses Transaksi Relokasi...
                            </>
                        ) : (
                            <>
                                <ArrowLeftRight className="h-3.5 w-3.5 mr-1.5" />
                                Proses Pemindahan Stok
                            </>
                        )}
                    </Button>
                }
            >
                <form id="transfer-form" onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="trf-item">Komoditas Barang (SKU) *</Label>
                        <select
                            id="trf-item"
                            name="itemId"
                            required
                            className="w-full text-xs h-9 rounded-xl border border-input bg-background px-3"
                        >
                            <option value="">-- Pilih Barang SKU --</option>
                            {items.map(i => (
                                <option key={String(i._id)} value={String(i._id)}>
                                    [{i.sku}] {i.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="trf-src">Lokasi Rak Asal (Source) *</Label>
                            <select
                                id="trf-src"
                                name="sourceLocationId"
                                required
                                className="w-full text-xs h-9 rounded-xl border border-input bg-background px-3"
                            >
                                <option value="">-- Pilih Lokasi Asal --</option>
                                {locations.map(l => (
                                    <option key={String(l._id)} value={String(l._id)}>
                                        [{l.code}] {l.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="trf-dest">Lokasi Rak Tujuan (Destination) *</Label>
                            <select
                                id="trf-dest"
                                name="destinationLocationId"
                                required
                                className="w-full text-xs h-9 rounded-xl border border-input bg-background px-3"
                            >
                                <option value="">-- Pilih Lokasi Tujuan --</option>
                                {locations.map(l => (
                                    <option key={String(l._id)} value={String(l._id)}>
                                        [{l.code}] {l.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="trf-qty">Jumlah Kuantitas Transfer *</Label>
                            <Input
                                id="trf-qty"
                                name="quantity"
                                type="number"
                                min="1"
                                step="1"
                                required
                                placeholder="0"
                                className="text-xs h-9 rounded-xl font-mono"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="trf-ref">Nomor Referensi Mutasi</Label>
                            <Input
                                id="trf-ref"
                                name="referenceNumber"
                                type="text"
                                placeholder="TRF-2026-001, dll"
                                className="text-xs h-9 rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="trf-reason">Alasan Pemindahan Rak</Label>
                        <Input
                            id="trf-reason"
                            name="reason"
                            type="text"
                            placeholder="Konsolidasi area, penataan lorong, stok replenishment..."
                            className="text-xs h-9 rounded-xl"
                        />
                    </div>
                </form>
            </FormCard>

            {/* Transfer Receipt Summary Card */}
            {result && (
                <Card className="glass-card border-blue-200/80 bg-blue-50/40 p-5 shadow-sm animate-scale-in">
                    <CardContent className="p-0 space-y-4">
                        <div className="flex items-center gap-2.5 text-blue-950">
                            <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0" />
                            <div>
                                <h3 className="text-sm font-bold tracking-tight">Transaksi Pemindahan Berhasil</h3>
                                <p className="text-xs text-blue-800 mt-0.5">{result.message}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="bg-white/90 border border-slate-200/80 rounded-xl p-3 shadow-xs">
                                <span className="text-[10px] font-semibold uppercase text-slate-400">Asal Sebelum</span>
                                <div className="text-lg font-bold font-mono text-slate-700 mt-0.5">
                                    {result.stockAtSource.before}
                                </div>
                            </div>

                            <div className="bg-white/90 border border-blue-200 rounded-xl p-3 shadow-xs">
                                <span className="text-[10px] font-semibold uppercase text-blue-600">Dipindahkan</span>
                                <div className="text-lg font-bold font-mono text-blue-600 mt-0.5">
                                    {result.stockAtSource.before - result.stockAtSource.after}
                                </div>
                            </div>

                            <div className="bg-white/90 border border-slate-200/80 rounded-xl p-3 shadow-xs">
                                <span className="text-[10px] font-semibold uppercase text-slate-400">Asal Sekarang</span>
                                <div className="text-lg font-bold font-mono text-blue-700 mt-0.5">
                                    {result.stockAtSource.after}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-blue-200/60">
                            <span className="font-mono">Ledger No: {result.movementNumber}</span>
                            <span className="text-blue-800 font-medium">Atomic Two-way Balance Update</span>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
