'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/auth/LoginForm';
import { getCurrentUserAction } from '@/app/actions';
import { LogoIcon } from '@/components/icons/LogoIcon';

export default function LoginPage() {
    const router = useRouter();

    useEffect(() => {
        // Deteksi user secara async
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
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 text-primary hover:text-primary/90 transition-colors mb-6"
                    >
                        <LogoIcon className="h-10 w-10 text-primary" />
                        <h1 className="text-4xl font-bold tracking-tight">
                            Stockpile
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
