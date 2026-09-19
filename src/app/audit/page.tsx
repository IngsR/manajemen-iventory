import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/Auth';
import { hasPermission } from '@/lib/Permissions';
import { getRecentAuditLogs } from '@/services/AuditLogService';

export const dynamic = 'force-dynamic';

export default async function AuditPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login');
    }

    if (!hasPermission(user.role, 'AUDIT_VIEW')) {
        return (
            <div style={{ padding: '2rem', color: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
                <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', backgroundColor: '#1e293b', padding: '2rem', borderRadius: '12px' }}>
                    <h2 style={{ color: '#ef4444' }}>Akses Ditolak</h2>
                    <p style={{ color: '#94a3b8' }}>Peran Anda ({user.role}) tidak memiliki izin untuk melihat Audit Trail (AUDIT_VIEW).</p>
                    <Link href="/" style={{ color: '#3b82f6', textDecoration: 'underline' }}>Kembali ke Beranda</Link>
                </div>
            </div>
        );
    }

    const logs = await getRecentAuditLogs(100);

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            padding: '2rem',
        }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <Link href="/" style={{ color: '#3b82f6', fontSize: '0.875rem', textDecoration: 'none', marginBottom: '0.5rem', display: 'inline-block' }}>
                            ← Kembali ke Dashboard
                        </Link>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Audit Trail (Jejak Aktivitas)</h1>
                        <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                            Catatan riwayat tindakan sistem yang bersifat append-only dan tidak dapat diubah/dihapus.
                        </p>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
                        Total log ditampilkan: <strong>{logs.length}</strong>
                    </div>
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
                                <th style={{ padding: '0.75rem 1rem' }}>Waktu</th>
                                <th style={{ padding: '0.75rem 1rem' }}>Pengguna</th>
                                <th style={{ padding: '0.75rem 1rem' }}>Peran</th>
                                <th style={{ padding: '0.75rem 1rem' }}>Aksi</th>
                                <th style={{ padding: '0.75rem 1rem' }}>Resource</th>
                                <th style={{ padding: '0.75rem 1rem' }}>ID Resource</th>
                                <th style={{ padding: '0.75rem 1rem' }}>Detail</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                                        Belum ada data audit log.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log._id.toHexString()} style={{ borderBottom: '1px solid #33415522' }}>
                                        <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap', color: '#94a3b8' }}>
                                            {new Date(log.timestamp).toLocaleString('id-ID')}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', fontWeight: 500, color: '#f8fafc' }}>
                                            {log.actorName}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '4px',
                                                fontSize: '0.75rem',
                                                backgroundColor: log.actorRole === 'ADMIN' ? '#ef444422' : log.actorRole === 'SUPERVISOR' ? '#f59e0b22' : '#3b82f622',
                                                color: log.actorRole === 'ADMIN' ? '#fca5a5' : log.actorRole === 'SUPERVISOR' ? '#fcd34d' : '#93c5fd',
                                            }}>
                                                {log.actorRole}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                                            {log.action}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', color: '#cbd5e1' }}>
                                            {log.resource}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', color: '#64748b', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                            {log.resourceId || '-'}
                                        </td>
                                        <td style={{ padding: '0.75rem 1rem', maxWidth: '300px' }}>
                                            {log.details ? (
                                                <pre style={{
                                                    margin: 0,
                                                    fontSize: '0.75rem',
                                                    color: '#cbd5e1',
                                                    whiteSpace: 'pre-wrap',
                                                    wordBreak: 'break-word',
                                                    fontFamily: 'monospace',
                                                }}>
                                                    {JSON.stringify(log.details, null, 2)}
                                                </pre>
                                            ) : '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
