'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { loginAction } from '@/actions/AuthActions';

export default function LoginPage() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);

        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
            const res = await loginAction(formData);
            if (!res.success) {
                setError(res.error || 'Login gagal.');
            } else {
                router.push('/');
                router.refresh();
            }
        });
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0f172a',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            padding: '1rem',
        }}>
            <div style={{
                width: '100%',
                maxWidth: '420px',
                backgroundColor: '#1e293b',
                borderRadius: '12px',
                border: '1px solid #334155',
                padding: '2rem',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ color: '#f8fafc', fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
                        Manajemen Inventory
                    </h1>
                    <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>
                        Masuk ke akun Anda untuk melanjutkan
                    </p>
                </div>

                {error && (
                    <div style={{
                        padding: '0.75rem 1rem',
                        backgroundColor: '#ef444422',
                        border: '1px solid #ef444466',
                        borderRadius: '8px',
                        color: '#fca5a5',
                        fontSize: '0.875rem',
                        marginBottom: '1.5rem',
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label
                            htmlFor="email"
                            style={{ display: 'block', color: '#cbd5e1', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 500 }}
                        >
                            Email
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            placeholder="nama@inventory.local"
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                backgroundColor: '#0f172a',
                                border: '1px solid #334155',
                                borderRadius: '8px',
                                color: '#f8fafc',
                                fontSize: '0.875rem',
                                boxSizing: 'border-box',
                                outline: 'none',
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label
                            htmlFor="password"
                            style={{ display: 'block', color: '#cbd5e1', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 500 }}
                        >
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            placeholder="••••••••"
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                backgroundColor: '#0f172a',
                                border: '1px solid #334155',
                                borderRadius: '8px',
                                color: '#f8fafc',
                                fontSize: '0.875rem',
                                boxSizing: 'border-box',
                                outline: 'none',
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isPending}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            backgroundColor: isPending ? '#475569' : '#3b82f6',
                            color: '#ffffff',
                            fontWeight: 600,
                            borderRadius: '8px',
                            border: 'none',
                            cursor: isPending ? 'not-allowed' : 'pointer',
                            fontSize: '0.925rem',
                            transition: 'background-color 0.2s',
                        }}
                    >
                        {isPending ? 'Memproses...' : 'Masuk'}
                    </button>
                </form>

                <div style={{
                    marginTop: '2rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid #334155',
                    fontSize: '0.75rem',
                    color: '#64748b',
                }}>
                    <p style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#94a3b8' }}>Akun Pengujian Dev:</p>
                    <div>• <strong>Admin:</strong> admin@inventory.local / admin123</div>
                    <div>• <strong>Supervisor:</strong> supervisor@inventory.local / supervisor123</div>
                    <div>• <strong>Petugas:</strong> petugas@inventory.local / petugas123</div>
                </div>
            </div>
        </div>
    );
}
