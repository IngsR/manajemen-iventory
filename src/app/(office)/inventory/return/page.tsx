'use client';

import { useState, useEffect } from 'react';
import { returnStockAction, ReturnStockResult } from '@/actions/ReturnStockAction';
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
    RotateCcw,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Undo2,
} from 'lucide-react';

export default function ReturnPage() {
    const [items, setItems] = useState<PopulatedItem[]>([]);
    const [locations, setLocations] = useState<LocationDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<ReturnStockResult | null>(null);
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
        const res = await returnStockAction(fd);

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
                <Loader2 className="h-6 w-6 animate-spin text-purple-600 mb-2" />
                <span>Memuat data master retur...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
            <PageHeader
                title="Retur Barang (Return to Inventory)"
                subtitle="Catat pengembalian barang dari peminjam, sisa proyek, atau retur customer ke gudang."
                icon={RotateCcw}
                badge={{ label: 'OPERASIONAL', variant: 'petugas' }}
                breadcrumbs={[
                    { label: 'StockFlow', href: '/' },
                    { label: 'Transaksi Stok' },
                    { label: 'Retur (Return)' },
                ]}
            />

            {error && (
                <div className="flex items-center gap-2.5 p-3.5 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200/80 rounded-xl animate-fade-in">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                    <span>{error}</span>
                </div>
            )}

            <FormCard
                title="Formulir Pengembalian Barang (Inbound Return)"
                description="Kuantitas yang dikembalikan akan otomatis menambahkan saldo stok pada lokasi terpilih."
                icon={Undo2}
                footer={
                    <Button
                        type="submit"
                        form="return-form"
                        disabled={submitting}
                        className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-9 rounded-xl shadow-sm px-5"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                Memproses Transaksi Retur...
                            </>
                        ) : (
                            <>
                                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                                Proses Retur Barang
                            </>
                        )}
                    </Button>
                }
            >
                <form id="return-form" onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="rtn-item">Komoditas Barang (SKU) *</Label>
                            <select
                                id="rtn-item"
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
                            <Label htmlFor="rtn-loc">Lokasi Rak Pengembalian *</Label>
                            <select
                                id="rtn-loc"
                                name="locationId"
                                required
                                className="w-full text-xs h-9 rounded-xl border border-input bg-background px-3"
                            >
                                <option value="">-- Pilih Lokasi --</option>
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
                            <Label htmlFor="rtn-qty">Jumlah Kuantitas Retur *</Label>
                            <Input
                                id="rtn-qty"
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
                            <Label htmlFor="rtn-ref">Nomor Referensi Berita Acara / Nota</Label>
                            <Input
                                id="rtn-ref"
                                name="referenceNumber"
                                type="text"
                                placeholder="RTN-2026-001, BAST-129, dll"
                                className="text-xs h-9 rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="rtn-reason">Alasan &amp; Kondisi Fisik Retur</Label>
                        <Input
                            id="rtn-reason"
                            name="reason"
                            type="text"
                            placeholder="Sisa pemakaian proyek, klaim garansi, pengembalian divisi..."
                            className="text-xs h-9 rounded-xl"
                        />
                    </div>
                </form>
            </FormCard>

            {/* Return Receipt Summary Card */}
            {result && (
                <Card className="glass-card border-purple-200/80 bg-purple-50/40 p-5 shadow-sm animate-scale-in">
                    <CardContent className="p-0 space-y-4">
                        <div className="flex items-center gap-2.5 text-purple-950">
                            <CheckCircle2 className="h-5 w-5 text-purple-600 shrink-0" />
                            <div>
                                <h3 className="text-sm font-bold tracking-tight">Transaksi Retur Berhasil</h3>
                                <p className="text-xs text-purple-800 mt-0.5">{result.message}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="bg-white/90 border border-slate-200/80 rounded-xl p-3 shadow-xs">
                                <span className="text-[10px] font-semibold uppercase text-slate-400">Saldo Awal</span>
                                <div className="text-lg font-bold font-mono text-slate-700 mt-0.5">
                                    {result.stockBefore}
                                </div>
                            </div>

                            <div className="bg-white/90 border border-purple-200 rounded-xl p-3 shadow-xs">
                                <span className="text-[10px] font-semibold uppercase text-purple-600">Dikembalikan (+)</span>
                                <div className="text-lg font-bold font-mono text-purple-600 mt-0.5">
                                    +{result.stockAfter - result.stockBefore}
                                </div>
                            </div>

                            <div className="bg-white/90 border border-slate-200/80 rounded-xl p-3 shadow-xs">
                                <span className="text-[10px] font-semibold uppercase text-slate-400">Saldo Akhir</span>
                                <div className="text-lg font-bold font-mono text-purple-700 mt-0.5">
                                    {result.stockAfter}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-purple-200/60">
                            <span className="font-mono">Ledger No: {result.movementNumber}</span>
                            <span className="text-purple-800 font-medium">Tercatat di StockBalance &amp; Audit Log</span>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
