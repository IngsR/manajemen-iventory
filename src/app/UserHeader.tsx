import Link from 'next/link';
import { getCurrentUser } from '@/lib/Auth';
import { logoutAction } from '@/actions/AuthActions';
import { hasPermission } from '@/lib/Permissions';

export async function UserHeader() {
    const user = await getCurrentUser();

    return (
        <header style={{
            borderBottom: '1px solid #334155',
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            padding: '0.75rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.875rem',
            fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <Link href="/" style={{ color: '#f8fafc', fontWeight: 700, textDecoration: 'none', fontSize: '1rem' }}>
                    📦 Manajemen Inventory
                </Link>
                <nav style={{ display: 'flex', gap: '1rem' }}>
                    <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none' }}>
                        Dashboard
                    </Link>
                    {user && hasPermission(user.role, 'AUDIT_VIEW') && (
                        <Link href="/audit" style={{ color: '#94a3b8', textDecoration: 'none' }}>
                            Audit Trail
                        </Link>
                    )}
                </nav>
            </div>

            <div>
                {user ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span>
                            Halo, <strong>{user.name}</strong>
                        </span>
                        <span style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            backgroundColor: user.role === 'ADMIN' ? '#ef444422' : user.role === 'SUPERVISOR' ? '#f59e0b22' : '#3b82f622',
                            color: user.role === 'ADMIN' ? '#fca5a5' : user.role === 'SUPERVISOR' ? '#fcd34d' : '#93c5fd',
                            border: `1px solid ${user.role === 'ADMIN' ? '#ef444455' : user.role === 'SUPERVISOR' ? '#f59e0b55' : '#3b82f655'}`,
                        }}>
                            {user.role}
                        </span>
                        <form action={logoutAction} style={{ display: 'inline', margin: 0 }}>
                            <button
                                type="submit"
                                style={{
                                    backgroundColor: 'transparent',
                                    border: '1px solid #475569',
                                    color: '#cbd5e1',
                                    padding: '0.35rem 0.75rem',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                }}
                            >
                                Logout
                            </button>
                        </form>
                    </div>
                ) : (
                    <Link
                        href="/login"
                        style={{
                            backgroundColor: '#3b82f6',
                            color: '#ffffff',
                            padding: '0.4rem 0.9rem',
                            borderRadius: '6px',
                            textDecoration: 'none',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                        }}
                    >
                        Masuk (Login)
                    </Link>
                )}
            </div>
        </header>
    );
}
