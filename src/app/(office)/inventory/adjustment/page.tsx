'use client';

import { useState, useEffect } from 'react';
import { adjustStockAction, AdjustStockResult } from '@/actions/AdjustStockAction';
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
    SlidersHorizontal,
    CheckCircle2,
    AlertCircle,
    Loader2,
    AlertTriangle,
    Scale,
} from 'lucide-react';

export default function AdjustmentPage() {
    const [items, setItems] = useState<PopulatedItem[]>([]);
    const [locations, setLocations] = useState<LocationDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<AdjustStockResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [delta, setDelta] = useState('');

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
        const res = await adjustStockAction(fd);

        if (res.success && res.data) {
            setResult(res.data);
            setDelta('');
            formElement.reset();
        } else {
            setError(res.error || 'Terjadi kesalahan');
        }
        setSubmitting(false);
    }

    const deltaNum = parseInt(delta, 10);
    const deltaColor =
        isNaN(deltaNum) || deltaNum === 0
            ? 'text-slate-400'
            : deltaNum > 0
            ? 'text-emerald-600'
            : 'text-rose-600';

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[300px] text-xs text-slate-500">
                <Loader2 className="h-6 w-6 animate-spin text-amber-600 mb-2" />
                <span>Memuat data master penyesuaian...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
            <PageHeader
                title="Koreksi Stok (Manual Stock Adjustment)"
                subtitle="Penyesuaian kuantitas fisik karena susut, kerusakan, temuan, atau rekonsiliasi data."
                icon={SlidersHorizontal}
                badge={{ label: 'OPERASIONAL', variant: 'petugas' }}
                breadcrumbs={[
                    { label: 'StockFlow', href: '/' },
                    { label: 'Transaksi Stok' },
                    { label: 'Koreksi (Adjustment)' },
                ]}
            />

            <div className="flex items-center gap-2.5 p-3.5 text-xs text-amber-900 bg-amber-50/80 border border-amber-200/80 rounded-xl">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                <span>
                    Adjustment langsung mengubah saldo StockBalance dan menghasilkan catatan immutable di Audit Trail. Wajib menyertakan alasan yang akuntabel.
                </span>
            </div>

            {error && (
                <div className="flex items-center gap-2.5 p-3.5 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200/80 rounded-xl animate-fade-in">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                    <span>{error}</span>
                </div>
            )}

            <FormCard
                title="Formulir Koreksi Kuantitas Stok"
                description="Masukkan kuantitas delta (+ untuk menambah, - untuk mengurangi). Nilai 0 tidak diperkenankan."
                icon={Scale}
                footer={
                    <Button
                        type="submit"
                        form="adjustment-form"
                        disabled={submitting}
                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-9 rounded-xl shadow-sm px-5"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                Memproses Rekonsiliasi...
                            </>
                        ) : (
                            <>
                                <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
                                Proses Koreksi Stok
                            </>
                        )}
                    </Button>
                }
            >
                <form id="adjustment-form" onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="adj-item">Komoditas Barang (SKU) *</Label>
                            <select
                                id="adj-item"
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

                        <div className="space-y-1.5">
                            <Label htmlFor="adj-loc">Lokasi Rak Penyesuaian *</Label>
                            <select
                                id="adj-loc"
                                name="locationId"
                                required
                                className="w-full text-xs h-9 rounded-xl border border-input bg-background px-3"
                            >
                                <option value="">-- Pilih Lokasi Rak --</option>
                                {locations.map(l => (
                                    <option key={String(l._id)} value={String(l._id)}>
                                        [{l.code}] {l.name} ({l.type})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="adj-qty">
                                    Kuantitas Delta (Perubahan) *
                                </Label>
                                {delta && !isNaN(deltaNum) && deltaNum !== 0 && (
                                    <span className={`text-xs font-mono font-bold ${deltaColor}`}>
                                        {deltaNum > 0 ? `+${deltaNum}` : deltaNum}
                                    </span>
                                )}
                            </div>
                            <Input
                                id="adj-qty"
                                name="quantityDelta"
                                type="number"
                                required
                                placeholder="Contoh: -5 (rusak) atau +10 (temuan)"
                                value={delta}
                                onChange={e => setDelta(e.target.value)}
                                className="text-xs h-9 rounded-xl font-mono"
                            />
                            <p className="text-[11px] text-slate-400">
                                Gunakan tanda minus (-) untuk pengurangan stok.
                            </p>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="adj-ref">Nomor Dokumen Referensi / Berita Acara</Label>
                            <Input
                                id="adj-ref"
                                name="referenceNumber"
                                type="text"
                                placeholder="ADJ-2026-001, BA-RUSAK-11, dll"
                                className="text-xs h-9 rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="adj-reason">Alasan Wajib Koreksi Stok *</Label>
                        <Input
                            id="adj-reason"
                            name="reason"
                            type="text"
                            required
                            placeholder="Contoh: Barang kadaluarsa, temuan rak tertimbun, selisih hitung..."
                            className="text-xs h-9 rounded-xl border-amber-300 focus-visible:ring-amber-500"
                        />
                    </div>
                </form>
            </FormCard>

            {/* Adjustment Receipt Summary Card */}
            {result && (
                <Card className="glass-card border-amber-200/80 bg-amber-50/40 p-5 shadow-sm animate-scale-in">
                    <CardContent className="p-0 space-y-4">
                        <div className="flex items-center gap-2.5 text-amber-950">
                            <CheckCircle2 className="h-5 w-5 text-amber-600 shrink-0" />
                            <div>
                                <h3 className="text-sm font-bold tracking-tight">Koreksi Stok Berhasil Diterapkan</h3>
                                <p className="text-xs text-amber-800 mt-0.5">{result.message}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="bg-white/90 border border-slate-200/80 rounded-xl p-3 shadow-xs">
                                <span className="text-[10px] font-semibold uppercase text-slate-400">Stok Awal</span>
                                <div className="text-lg font-bold font-mono text-slate-700 mt-0.5">
                                    {result.stockBefore}
                                </div>
                            </div>

                            <div className="bg-white/90 border border-amber-200 rounded-xl p-3 shadow-xs">
                                <span className="text-[10px] font-semibold uppercase text-amber-600">Delta Koreksi</span>
                                <div
                                    className={`text-lg font-bold font-mono mt-0.5 ${
                                        result.stockAfter >= result.stockBefore
                                            ? 'text-emerald-600'
                                            : 'text-rose-600'
                                    }`}
                                >
                                    {result.stockAfter - result.stockBefore > 0 ? '+' : ''}
                                    {result.stockAfter - result.stockBefore}
                                </div>
                            </div>

                            <div className="bg-white/90 border border-slate-200/80 rounded-xl p-3 shadow-xs">
                                <span className="text-[10px] font-semibold uppercase text-slate-400">Stok Disesuaikan</span>
                                <div className="text-lg font-bold font-mono text-amber-800 mt-0.5">
                                    {result.stockAfter}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-amber-200/60">
                            <span className="font-mono">Ledger No: {result.movementNumber}</span>
                            <span className="text-amber-800 font-medium">Audit Trail &amp; Ledger Log Recorded</span>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
