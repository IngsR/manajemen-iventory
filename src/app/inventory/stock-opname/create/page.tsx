import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/Auth';
import { hasPermission } from '@/lib/Permissions';
import { getWarehouseCollection } from '@/models/WarehouseModel';
import { createStockOpnameAction } from '@/actions/StockOpnameActions';

export const dynamic = 'force-dynamic';

export default async function CreateStockOpnamePage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login');
    }

    if (!hasPermission(user.role, 'STOCK_OPNAME_CREATE')) {
        return (
            <div style={{ padding: '2rem', color: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
                <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', backgroundColor: '#1e293b', padding: '2rem', borderRadius: '12px' }}>
                    <h2 style={{ color: '#ef4444' }}>Akses Ditolak</h2>
                    <p style={{ color: '#94a3b8' }}>Peran Anda ({user.role}) tidak memiliki izin membuat Stock Opname.</p>
                    <Link href="/inventory/stock-opname" style={{ color: '#3b82f6', textDecoration: 'underline' }}>Kembali</Link>
                </div>
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
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            padding: '2rem',
        }}>
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                <Link href="/inventory/stock-opname" style={{ color: '#3b82f6', fontSize: '0.875rem', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>
                    ← Kembali ke Daftar Opname
                </Link>

                <div style={{ backgroundColor: '#1e293b', padding: '2rem', borderRadius: '12px', border: '1px solid #334155' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Buat Dokumen Stock Opname</h1>
                    <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                        Pilih gudang yang akan dihitung fisiknya. Dokumen awal akan dibuat berstatus DRAFT.
                    </p>

                    <form action={handleCreate}>
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 500 }}>
                                Gudang Persediaan *
                            </label>
                            <select
                                name="warehouseId"
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    backgroundColor: '#0f172a',
                                    border: '1px solid #334155',
                                    borderRadius: '8px',
                                    color: '#f8fafc',
                                    fontSize: '0.875rem',
                                    boxSizing: 'border-box',
                                }}
                            >
                                <option value="">-- Pilih Gudang --</option>
                                {warehouses.map((w) => (
                                    <option key={w._id.toHexString()} value={w._id.toHexString()}>
                                        {w.name} ({w.code})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 500 }}>
                                Catatan / Keterangan Opname (Opsional)
                            </label>
                            <textarea
                                name="notes"
                                rows={3}
                                placeholder="Contoh: Stock Opname Rutin Akhir Bulan"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    backgroundColor: '#0f172a',
                                    border: '1px solid #334155',
                                    borderRadius: '8px',
                                    color: '#f8fafc',
                                    fontSize: '0.875rem',
                                    boxSizing: 'border-box',
                                }}
                            />
                        </div>

                        <button
                            type="submit"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                backgroundColor: '#3b82f6',
                                color: '#ffffff',
                                fontWeight: 600,
                                borderRadius: '8px',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                            }}
                        >
                            Buat Draft Opname →
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
