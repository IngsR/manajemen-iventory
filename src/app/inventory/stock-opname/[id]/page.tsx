import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/Auth';
import { hasPermission } from '@/lib/Permissions';
import { getStockOpnameDetail } from '@/services/inventory/StockOpnameService';
import { getItemCollection } from '@/models/ItemModel';
import { getLocationCollection } from '@/models/LocationModel';
import {
    addStockOpnameItemAction,
    removeStockOpnameItemAction,
    submitStockOpnameAction,
    approveStockOpnameAction,
    rejectStockOpnameAction,
} from '@/actions/StockOpnameActions';

export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function StockOpnameDetailPage({ params }: PageProps) {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login');
    }

    if (!hasPermission(user.role, 'STOCK_OPNAME_VIEW')) {
        return (
            <div style={{ padding: '2rem', color: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
                <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', backgroundColor: '#1e293b', padding: '2rem', borderRadius: '12px' }}>
                    <h2 style={{ color: '#ef4444' }}>Akses Ditolak</h2>
                    <p style={{ color: '#94a3b8' }}>Anda tidak memiliki izin melihat dokumen Stock Opname.</p>
                    <Link href="/inventory/stock-opname" style={{ color: '#3b82f6', textDecoration: 'underline' }}>Kembali</Link>
                </div>
            </div>
        );
    }

    const { id } = await params;
    const opname = await getStockOpnameDetail(id);

    if (!opname) {
        notFound();
    }

    const canEdit = opname.status === 'DRAFT' && hasPermission(user.role, 'STOCK_OPNAME_CREATE');
    const canSubmit = opname.status === 'DRAFT' && hasPermission(user.role, 'STOCK_OPNAME_SUBMIT') && opname.items.length > 0;
    const canReview = opname.status === 'SUBMITTED' && (hasPermission(user.role, 'STOCK_OPNAME_APPROVE') || hasPermission(user.role, 'STOCK_OPNAME_REJECT'));

    const itemsCol = await getItemCollection();
    const availableItems = await itemsCol.find({ isDeleted: false, status: 'ACTIVE' }).sort({ name: 1 }).toArray();

    const locCol = await getLocationCollection();
    const availableLocations = await locCol.find({ warehouseId: opname.warehouseId, isDeleted: false, status: 'ACTIVE' }).sort({ code: 1 }).toArray();

    const statusColor =
        opname.status === 'APPROVED' ? '#22c55e' :
        opname.status === 'REJECTED' ? '#ef4444' :
        opname.status === 'SUBMITTED' ? '#f59e0b' : '#94a3b8';

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            padding: '2rem',
        }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                <Link href="/inventory/stock-opname" style={{ color: '#3b82f6', fontSize: '0.875rem', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>
                    ← Kembali ke Daftar Opname
                </Link>

                {/* Header Card */}
                <div style={{
                    backgroundColor: '#1e293b',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    border: '1px solid #334155',
                    marginBottom: '1.5rem',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, fontFamily: 'monospace' }}>
                                    {opname.opnameNumber}
                                </h1>
                                <span style={{
                                    padding: '0.25rem 0.6rem',
                                    borderRadius: '6px',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    backgroundColor: `${statusColor}22`,
                                    color: statusColor,
                                    border: `1px solid ${statusColor}55`,
                                }}>
                                    {opname.status}
                                </span>
                            </div>
                            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.35rem', marginBottom: 0 }}>
                                Gudang: <strong>{opname.warehouseName || 'Gudang'}</strong> | Dibuat oleh: <strong>{opname.createdBy.name}</strong> ({new Date(opname.createdAt).toLocaleString('id-ID')})
                            </p>
                            {opname.notes && (
                                <p style={{ color: '#cbd5e1', fontSize: '0.875rem', marginTop: '0.5rem', marginBottom: 0 }}>
                                    <em>Catatan: &ldquo;{opname.notes}&rdquo;</em>
                                </p>
                            )}
                        </div>

                        {/* Submit Button for DRAFT */}
                        {canSubmit && (
                            <form
                                action={async () => {
                                    'use server';
                                    await submitStockOpnameAction(opname._id.toHexString());
                                }}
                            >
                                <button
                                    type="submit"
                                    style={{
                                        backgroundColor: '#f59e0b',
                                        color: '#0f172a',
                                        fontWeight: 700,
                                        padding: '0.6rem 1.2rem',
                                        borderRadius: '8px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '0.875rem',
                                    }}
                                >
                                    Ajukan Opname (Submit untuk Review) →
                                </button>
                            </form>
                        )}
                    </div>

                    {/* Reviewer / Rejection info */}
                    {opname.status === 'APPROVED' && opname.reviewedBy && (
                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #334155', color: '#86efac', fontSize: '0.85rem' }}>
                            ✓ Disetujui oleh <strong>{opname.reviewedBy.name}</strong> ({opname.reviewedBy.role}) pada {opname.reviewedAt ? new Date(opname.reviewedAt).toLocaleString('id-ID') : '-'}
                        </div>
                    )}
                    {opname.status === 'REJECTED' && (
                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #334155', color: '#fca5a5', fontSize: '0.85rem' }}>
                            ✕ Ditolak oleh <strong>{opname.reviewedBy?.name || 'Supervisor'}</strong> pada {opname.reviewedAt ? new Date(opname.reviewedAt).toLocaleString('id-ID') : '-'}
                            <div style={{ marginTop: '0.25rem', color: '#f87171' }}>
                                Alasan penolakan: &ldquo;{opname.rejectionReason}&rdquo;
                            </div>
                        </div>
                    )}
                </div>

                {/* Review Action Panel for Supervisor when SUBMITTED */}
                {canReview && (
                    <div style={{
                        backgroundColor: '#1e293b',
                        padding: '1.5rem',
                        borderRadius: '12px',
                        border: '1px solid #f59e0b55',
                        marginBottom: '1.5rem',
                    }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fcd34d', margin: '0 0 0.5rem 0' }}>
                            Tindakan Supervisor (Review Dokumen)
                        </h2>
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1rem' }}>
                            Periksa hasil hitung fisik di bawah. Jika disetujui, perubahan stok akan dieksekusi secara otomatis dan atomik.
                        </p>

                        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                            {/* Approve form */}
                            <form
                                action={async () => {
                                    'use server';
                                    await approveStockOpnameAction(opname._id.toHexString());
                                }}
                            >
                                <button
                                    type="submit"
                                    style={{
                                        backgroundColor: '#22c55e',
                                        color: '#ffffff',
                                        fontWeight: 700,
                                        padding: '0.65rem 1.25rem',
                                        borderRadius: '8px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '0.875rem',
                                    }}
                                >
                                    ✓ Setujui Opname (Approve)
                                </button>
                            </form>

                            {/* Reject form */}
                            <form
                                action={async (formData) => {
                                    'use server';
                                    await rejectStockOpnameAction(formData);
                                }}
                                style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flex: 1 }}
                            >
                                <input type="hidden" name="stockOpnameId" value={opname._id.toHexString()} />
                                <input
                                    name="rejectionReason"
                                    required
                                    placeholder="Tulis alasan penolakan jika ditolak..."
                                    style={{
                                        flex: 1,
                                        padding: '0.6rem 0.8rem',
                                        backgroundColor: '#0f172a',
                                        border: '1px solid #ef444488',
                                        borderRadius: '8px',
                                        color: '#f8fafc',
                                        fontSize: '0.85rem',
                                    }}
                                />
                                <button
                                    type="submit"
                                    style={{
                                        backgroundColor: '#ef4444',
                                        color: '#ffffff',
                                        fontWeight: 700,
                                        padding: '0.65rem 1rem',
                                        borderRadius: '8px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '0.875rem',
                                    }}
                                >
                                    ✕ Tolak (Reject)
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Items Table */}
                <div style={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    border: '1px solid #334155',
                    overflowX: 'auto',
                    marginBottom: '1.5rem',
                }}>
                    <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #334155', fontWeight: 600 }}>
                        Detail Hasil Hitung Fisik ({opname.items.length} item)
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                                <th style={{ padding: '0.75rem 1rem' }}>SKU</th>
                                <th style={{ padding: '0.75rem 1rem' }}>Nama Barang</th>
                                <th style={{ padding: '0.75rem 1rem' }}>Lokasi Rak/Bin</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Stok Sistem (Snapshot)</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Hitung Fisik</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Selisih</th>
                                {canEdit && <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Aksi</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {opname.items.length === 0 ? (
                                <tr>
                                    <td colSpan={canEdit ? 7 : 6} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                                        Belum ada item yang dihitung pada opname ini.
                                    </td>
                                </tr>
                            ) : (
                                opname.items.map((item) => {
                                    const diffColor =
                                        item.difference > 0 ? '#22c55e' :
                                        item.difference < 0 ? '#ef4444' : '#94a3b8';

                                    return (
                                        <tr key={item._id.toHexString()} style={{ borderBottom: '1px solid #33415522' }}>
                                            <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#f8fafc', fontFamily: 'monospace' }}>
                                                {item.sku}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', color: '#cbd5e1' }}>
                                                {item.itemName || '-'}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', color: '#94a3b8' }}>
                                                {item.locationName} ({item.locationCode})
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontFamily: 'monospace' }}>
                                                {item.systemQuantity}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
                                                {item.countedQuantity}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: diffColor }}>
                                                {item.difference > 0 ? `+${item.difference}` : item.difference}
                                            </td>
                                            {canEdit && (
                                                <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                                    <form
                                                        action={async () => {
                                                            'use server';
                                                            await removeStockOpnameItemAction(
                                                                opname._id.toHexString(),
                                                                item._id.toHexString()
                                                            );
                                                        }}
                                                    >
                                                        <button
                                                            type="submit"
                                                            style={{
                                                                backgroundColor: 'transparent',
                                                                border: 'none',
                                                                color: '#ef4444',
                                                                cursor: 'pointer',
                                                                fontSize: '0.8rem',
                                                                textDecoration: 'underline',
                                                            }}
                                                        >
                                                            Hapus
                                                        </button>
                                                    </form>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Form to add/update item if DRAFT */}
                {canEdit && (
                    <div style={{
                        backgroundColor: '#1e293b',
                        padding: '1.5rem',
                        borderRadius: '12px',
                        border: '1px solid #334155',
                    }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 1rem 0' }}>
                            + Input / Perbarui Hasil Hitung Fisik
                        </h2>
                        <form
                            action={async (formData) => {
                                'use server';
                                await addStockOpnameItemAction(formData);
                            }}
                            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}
                        >
                            <input type="hidden" name="stockOpnameId" value={opname._id.toHexString()} />

                            <div>
                                <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                                    Barang *
                                </label>
                                <select
                                    name="itemId"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.6rem',
                                        backgroundColor: '#0f172a',
                                        border: '1px solid #334155',
                                        borderRadius: '6px',
                                        color: '#f8fafc',
                                        fontSize: '0.85rem',
                                    }}
                                >
                                    <option value="">-- Pilih Barang --</option>
                                    {availableItems.map((i) => (
                                        <option key={i._id.toHexString()} value={i._id.toHexString()}>
                                            {i.name} ({i.sku})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                                    Lokasi Rak/Bin *
                                </label>
                                <select
                                    name="locationId"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.6rem',
                                        backgroundColor: '#0f172a',
                                        border: '1px solid #334155',
                                        borderRadius: '6px',
                                        color: '#f8fafc',
                                        fontSize: '0.85rem',
                                    }}
                                >
                                    <option value="">-- Pilih Lokasi --</option>
                                    {availableLocations.map((l) => (
                                        <option key={l._id.toHexString()} value={l._id.toHexString()}>
                                            {l.name} ({l.code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                                    Hasil Hitung Fisik *
                                </label>
                                <input
                                    name="countedQuantity"
                                    type="number"
                                    min={0}
                                    required
                                    placeholder="0"
                                    style={{
                                        width: '100%',
                                        padding: '0.6rem',
                                        backgroundColor: '#0f172a',
                                        border: '1px solid #334155',
                                        borderRadius: '6px',
                                        color: '#f8fafc',
                                        fontSize: '0.85rem',
                                        boxSizing: 'border-box',
                                    }}
                                />
                            </div>

                            <button
                                type="submit"
                                style={{
                                    backgroundColor: '#3b82f6',
                                    color: '#ffffff',
                                    fontWeight: 600,
                                    padding: '0.65rem 1rem',
                                    borderRadius: '6px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                }}
                            >
                                Simpan Hitung Fisik
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
