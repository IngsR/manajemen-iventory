'use client';

import { getCurrentUserAction } from '@/app/actions';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [currentYear, setCurrentYear] = useState<number | null>(null);

    useEffect(() => {
        setCurrentYear(new Date().getFullYear());

        const checkAuth = async () => {
            const user = await getCurrentUserAction();
            if (!user || user.role !== 'admin') {
                redirect('/login');
            }
        };
        checkAuth();
    }, []);

    return (
        <div className="flex flex-col flex-grow">
            <div className="container mx-auto px-4 py-8 flex-grow">
                {children}
            </div>
            <footer className="bg-white text-black py-6 text-center text-sm w-full border-t border-gray-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700">
                © {currentYear || ''}{' '}
                <a
                    href="https://github.com/IngsR"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary font-medium hover:underline transition-colors"
                >
                    IngsR
                </a>{' '}
                · Ikhwan Ramadhan · MIT License
            </footer>
        </div>
    );
}
