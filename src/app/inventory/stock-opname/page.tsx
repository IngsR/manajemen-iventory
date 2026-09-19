import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/Auth';
import { hasPermission } from '@/lib/Permissions';
import { getStockOpnames } from '@/services/inventory/StockOpnameService';
import { getWarehouseCollection } from '@/models/WarehouseModel';

export const dynamic = 'force-dynamic';

export default async function StockOpnameListPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login');
    }

    if (!hasPermission(user.role, 'STOCK_OPNAME_VIEW')) {
        return (
            <div style={{ padding: '2rem', color: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
                <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', backgroundColor: '#1e293b', padding: '2rem', borderRadius: '12px' }}>
                    <h2 style={{ color: '#ef4444' }}>Akses Ditolak</h2>
                    <p style={{ color: '#94a3b8' }}>Peran Anda ({user.role}) tidak memiliki izin untuk melihat Stock Opname.</p>
                    <Link href="/" style={{ color: '#3b82f6', textDecoration: 'underline' }}>Kembali ke Beranda</Link>
                </div>
            </div>
        );
    }

    const opnames = await getStockOpnames();
    const warehouseCol = await getWarehouseCollection();
    const warehouses = await warehouseCol.find({}).toArray();
    const whMap = new Map(warehouses.map((w) => [w._id.toHexString(), w.name]));

    const canCreate = hasPermission(user.role, 'STOCK_OPNAME_CREATE');

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            padding: '2rem',
        }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <Link href="/" style={{ color: '#3b82f6', fontSize: '0.875rem', textDecoration: 'none', marginBottom: '0.5rem', display: 'inline-block' }}>
                            ← Kembali ke Dashboard
                        </Link>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Stock Opname</h1>
                        <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                            Pencocokan kuantitas fisik gudang dengan sistem & approval Supervisor
                        </p>
                    </div>

                    {canCreate && (
                        <Link
                            href="/inventory/stock-opname/create"
                            style={{
                                backgroundColor: '#3b82f6',
                                color: '#ffffff',
                                padding: '0.6rem 1.2rem',
                                borderRadius: '8px',
                                textDecoration: 'none',
                                fontWeight: 600,
                                fontSize: '0.875rem',
                            }}
                        >
                            + Buat Opname Baru
                        </Link>
                    )}
                </div>

                <div style={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    border: '1px solid #334155',
                    overflowX: 'auto',
                }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                                <th style={{ padding: '0.75rem 1rem' }}>Nomor Opname</th>
                                <th style={{ padding: '0.75rem 1rem' }}>Gudang</th>
                                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                                <th style={{ padding: '0.75rem 1rem' }}>Pembuat</th>
                                <th style={{ padding: '0.75rem 1rem' }}>Tanggal Dibuat</th>
                                <th style={{ padding: '0.75rem 1rem' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {opnames.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                                        Belum ada dokumen stock opname.
                                    </td>
                                </tr>
                            ) : (
                                opnames.map((op) => {
                                    const statusColor =
                                        op.status === 'APPROVED' ? '#22c55e' :
                                        op.status === 'REJECTED' ? '#ef4444' :
                                        op.status === 'SUBMITTED' ? '#f59e0b' : '#94a3b8';

                                    return (
                                        <tr key={op._id.toHexString()} style={{ borderBottom: '1px solid #33415522' }}>
                                            <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#f8fafc', fontFamily: 'monospace' }}>
                                                {op.opnameNumber}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', color: '#cbd5e1' }}>
                                                {whMap.get(op.warehouseId.toHexString()) || 'Gudang'}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <span style={{
                                                    padding: '0.2rem 0.5rem',
                                                    borderRadius: '4px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    backgroundColor: `${statusColor}22`,
                                                    color: statusColor,
                                                    border: `1px solid ${statusColor}55`,
                                                }}>
                                                    {op.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', color: '#cbd5e1' }}>
                                                {op.createdBy.name} ({op.createdBy.role})
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem', color: '#94a3b8' }}>
                                                {new Date(op.createdAt).toLocaleDateString('id-ID')}
                                            </td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <Link
                                                    href={`/inventory/stock-opname/${op._id.toHexString()}`}
                                                    style={{
                                                        color: '#3b82f6',
                                                        textDecoration: 'none',
                                                        fontWeight: 500,
                                                    }}
                                                >
                                                    Buka Detail →
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
