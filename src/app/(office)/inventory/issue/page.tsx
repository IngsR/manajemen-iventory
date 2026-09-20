'use client';

import { useState, useEffect } from 'react';
import { issueStockAction, IssueStockResult } from '@/actions/IssueStockAction';
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
    ArrowUpFromLine,
    CheckCircle2,
    AlertCircle,
    Loader2,
    PackageMinus,
} from 'lucide-react';

export default function IssuePage() {
    const [items, setItems] = useState<PopulatedItem[]>([]);
    const [locations, setLocations] = useState<LocationDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<IssueStockResult | null>(null);
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
        const res = await issueStockAction(fd);

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
                <Loader2 className="h-6 w-6 animate-spin text-orange-600 mb-2" />
                <span>Memuat data master pengeluaran...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
            <PageHeader
                title="Pengeluaran Barang (Outbound Issue)"
                subtitle="Catat pelepasan dan pengeluaran fisik barang dari persediaan gudang."
                icon={ArrowUpFromLine}
                badge={{ label: 'OPERASIONAL', variant: 'petugas' }}
                breadcrumbs={[
                    { label: 'StockFlow', href: '/' },
                    { label: 'Transaksi Stok' },
                    { label: 'Pengeluaran (Issue)' },
                ]}
            />

            {error && (
                <div className="flex items-center gap-2.5 p-3.5 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200/80 rounded-xl animate-fade-in">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                    <span>{error}</span>
                </div>
            )}

            <FormCard
                title="Formulir Pengeluaran Barang"
                description="Sistem akan memeriksa saldo stok secara otomatis untuk mencegah stok minus."
                icon={PackageMinus}
                footer={
                    <Button
                        type="submit"
                        form="issue-form"
                        disabled={submitting}
                        className="bg-orange-600 hover:bg-orange-700 text-white text-xs h-9 rounded-xl shadow-sm px-5"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                Memproses Ledger Transaksi...
                            </>
                        ) : (
                            <>
                                <ArrowUpFromLine className="h-3.5 w-3.5 mr-1.5" />
                                Proses Pengeluaran Stok
                            </>
                        )}
                    </Button>
                }
            >
                <form id="issue-form" onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="issue-item">Komoditas Barang (SKU) *</Label>
                            <select
                                id="issue-item"
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
                            <Label htmlFor="issue-loc">Titik Lokasi Asal Pengambilan *</Label>
                            <select
                                id="issue-loc"
                                name="locationId"
                                required
                                className="w-full text-xs h-9 rounded-xl border border-input bg-background px-3"
                            >
                                <option value="">-- Pilih Lokasi Asal --</option>
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
                            <Label htmlFor="issue-qty">Jumlah Kuantitas Dikeluarkan *</Label>
                            <Input
                                id="issue-qty"
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
                            <Label htmlFor="issue-ref">Nomor Referensi Kerja</Label>
                            <Input
                                id="issue-ref"
                                name="referenceNumber"
                                type="text"
                                placeholder="WO-2026-001, REQ-889, dll"
                                className="text-xs h-9 rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="issue-reason">Alasan / Keterangan Keperluan</Label>
                        <Input
                            id="issue-reason"
                            name="reason"
                            type="text"
                            placeholder="Pemenuhan order pelanggan, material lini perakitan..."
                            className="text-xs h-9 rounded-xl"
                        />
                    </div>
                </form>
            </FormCard>

            {/* Issue Receipt Summary Card */}
            {result && (
                <Card className="glass-card border-orange-200/80 bg-orange-50/40 p-5 shadow-sm animate-scale-in">
                    <CardContent className="p-0 space-y-4">
                        <div className="flex items-center gap-2.5 text-orange-950">
                            <CheckCircle2 className="h-5 w-5 text-orange-600 shrink-0" />
                            <div>
                                <h3 className="text-sm font-bold tracking-tight">Transaksi Pengeluaran Berhasil</h3>
                                <p className="text-xs text-orange-800 mt-0.5">{result.message}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="bg-white/90 border border-slate-200/80 rounded-xl p-3 shadow-xs">
                                <span className="text-[10px] font-semibold uppercase text-slate-400">Saldo Awal</span>
                                <div className="text-lg font-bold font-mono text-slate-700 mt-0.5">
                                    {result.stockBefore}
                                </div>
                            </div>

                            <div className="bg-white/90 border border-orange-200 rounded-xl p-3 shadow-xs">
                                <span className="text-[10px] font-semibold uppercase text-orange-600">Dikeluarkan (-)</span>
                                <div className="text-lg font-bold font-mono text-orange-600 mt-0.5">
                                    -{result.stockBefore - result.stockAfter}
                                </div>
                            </div>

                            <div className="bg-white/90 border border-slate-200/80 rounded-xl p-3 shadow-xs">
                                <span className="text-[10px] font-semibold uppercase text-slate-400">Sisa Stok Sekarang</span>
                                <div className="text-lg font-bold font-mono text-orange-700 mt-0.5">
                                    {result.stockAfter}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-orange-200/60">
                            <span className="font-mono">Ledger No: {result.movementNumber}</span>
                            <span className="text-orange-800 font-medium">Tercatat di StockBalance &amp; Audit Log</span>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
