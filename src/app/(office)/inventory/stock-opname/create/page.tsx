import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/Auth';
import { hasPermission } from '@/lib/Permissions';
import { getWarehouseCollection } from '@/models/WarehouseModel';
import { createStockOpnameAction } from '@/actions/StockOpnameActions';
import { PageHeader } from '@/components/shared/PageHeader';
import { FormCard } from '@/components/shared/FormCard';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    ClipboardPen,
    Warehouse,
    ArrowRight,
    ShieldX,
    ArrowLeft,
    Plus,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CreateStockOpnamePage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login');
    }

    if (!hasPermission(user.role, 'STOCK_OPNAME_CREATE')) {
        return (
            <div className="max-w-md mx-auto my-12 animate-scale-in">
                <Card className="glass-card border-rose-200/80 shadow-lg text-center p-6">
                    <CardContent className="space-y-4 pt-4">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 border border-rose-200 text-rose-600">
                            <ShieldX className="h-7 w-7" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-900">Akses Ditolak</h2>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Peran Anda ({user.role}) tidak memiliki izin membuat Stock Opname.
                        </p>
                        <Link href="/inventory/stock-opname">
                            <Button variant="outline" size="sm" className="rounded-xl text-xs mt-2">
                                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                                Kembali
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const warehouseCol = await getWarehouseCollection();
    const warehouses = await warehouseCol.find({ isDeleted: false, status: 'ACTIVE' }).toArray();

    async function handleCreate(formData: FormData) {
        'use server';
        const res = await createStockOpnameAction(formData);
        if (res.success && res.data?.stockOpnameId) {
            redirect(`/inventory/stock-opname/${res.data.stockOpnameId}`);
        }
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
            <PageHeader
                title="Buat Dokumen Stock Opname"
                subtitle="Inisialisasi lembar hitung fisik persediaan gudang baru dalam status draft."
                icon={ClipboardPen}
                badge={{ label: 'OPERASIONAL', variant: 'petugas' }}
                breadcrumbs={[
                    { label: 'StockFlow', href: '/' },
                    { label: 'Stock Opname', href: '/inventory/stock-opname' },
                    { label: 'Buat Baru' },
                ]}
            />

            <FormCard
                title="Inisialisasi Sesi Opname Fisik"
                description="Tentukan fasilitas gudang yang akan diaudit dan catat keterangan periode opname."
                icon={Warehouse}
                footer={
                    <Button
                        type="submit"
                        form="create-opname-form"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 rounded-xl shadow-sm px-5"
                    >
                        Buat Draft Opname
                        <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                    </Button>
                }
            >
                <form id="create-opname-form" action={handleCreate} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="opname-warehouse">Fasilitas Gudang Persediaan *</Label>
                        <select
                            id="opname-warehouse"
                            name="warehouseId"
                            required
                            className="w-full text-xs h-10 rounded-xl border border-input bg-background px-3"
                        >
                            <option value="">-- Pilih Fasilitas Gudang --</option>
                            {warehouses.map((w) => (
                                <option key={w._id.toHexString()} value={w._id.toHexString()}>
                                    {w.name} ({w.code})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="opname-notes">Catatan / Keterangan Sesi Opname (Opsional)</Label>
                        <textarea
                            id="opname-notes"
                            name="notes"
                            rows={2}
                            placeholder="Contoh: Stock Opname Rutin Akhir Bulan, Audit Periodik..."
                            className="w-full text-xs rounded-xl border border-input bg-background p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                    </div>

                    {/* Corporate Auto Snapshot Feature (Minimal Step) */}
                    <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60 flex items-start gap-3">
                        <input
                            type="checkbox"
                            id="auto-snapshot"
                            name="autoSnapshot"
                            value="true"
                            defaultChecked
                            className="mt-1 h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <div className="space-y-0.5">
                            <label htmlFor="auto-snapshot" className="text-xs font-bold text-emerald-950 cursor-pointer">
                                Otomatis Muat Snapshot Seluruh Stok Gudang (Rekomendasi)
                            </label>
                            <p className="text-[11px] text-emerald-700 leading-relaxed">
                                Memuat seluruh item &amp; saldo sistem di gudang ini seketika. Anda tinggal verifikasi fisik atau klik 1 tombol jika semua cocok tanpa perlu input manual satu per satu.
                            </p>
                        </div>
                    </div>
                </form>
            </FormCard>
        </div>
    );
}
