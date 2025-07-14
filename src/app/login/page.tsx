'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/auth/LoginForm';
import { getCurrentUserAction } from '@/app/actions';
import { LogoIcon } from '@/components/icons/LogoIcon';

export default function LoginPage() {
    const router = useRouter();
    const [showPopup, setShowPopup] = useState(true);

    useEffect(() => {
        const checkUser = async () => {
            try {
                const user = await getCurrentUserAction();
                if (user) {
                    if (user.role === 'admin') {
                        router.replace('/admin/dashboard');
                    } else {
                        router.replace('/');
                    }
                }
            } catch (error) {
                console.warn(
                    '[LoginPage] Failed to fetch user session:',
                    error,
                );
            }
        };

        checkUser();
    }, [router]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
            {/* === POPUP === */}
            {showPopup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
                    <div className="bg-white max-w-md w-full rounded-xl shadow-xl p-6 relative animate-fade-in">
                        <button
                            onClick={() => setShowPopup(false)}
                            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 transition"
                            aria-label="Close"
                        >
                            ✕
                        </button>
                        <div className="text-center">
                            <h3 className="text-2xl font-semibold text-primary mb-4">
                                👋 Selamat Datang!
                            </h3>
                            <p className="text-sm text-gray-600 mb-6">
                                Ini adalah website demo. Silakan gunakan
                                kredensial berikut untuk login:
                            </p>

                            <div className="grid grid-cols-2 gap-4 text-left text-sm">
                                <div>
                                    <h4 className="font-semibold text-foreground mb-1">
                                        Admin
                                    </h4>
                                    <p>
                                        👤{' '}
                                        <code className="font-mono text-sm">
                                            admin
                                        </code>
                                    </p>
                                    <p>
                                        🔑{' '}
                                        <code className="font-mono text-sm">
                                            admin123
                                        </code>
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-foreground mb-1">
                                        Karyawan
                                    </h4>
                                    <p>
                                        👤{' '}
                                        <code className="font-mono text-sm">
                                            budi
                                        </code>
                                    </p>
                                    <p>
                                        🔑{' '}
                                        <code className="font-mono text-sm">
                                            budi123
                                        </code>
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowPopup(false)}
                                className="mt-6 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition"
                            >
                                Mengerti
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* === HALAMAN LOGIN === */}
            <div className="w-full max-w-md space-y-8 z-10">
                <div className="text-center">
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 text-primary hover:text-primary/90 transition-colors mb-6"
                    >
                        <LogoIcon className="h-10 w-10 text-primary" />
                        <h1 className="text-4xl font-bold tracking-tight">
                            Manajemen Iventory
                        </h1>
                    </Link>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                        Selamat Datang Kembali
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Silakan masuk untuk mengakses inventaris Anda.
                    </p>
                </div>
                <LoginForm />
                <p className="mt-10 text-center text-xs text-muted-foreground">
                    Lupa password? Hubungi administrator.
                </p>
            </div>
        </div>
    );
}
