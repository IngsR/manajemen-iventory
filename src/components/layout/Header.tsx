'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
    Home,
    BarChart4,
    AlertTriangle,
    LogIn,
    LogOut,
    ShieldCheck,
} from 'lucide-react';
import { LogoIcon } from '@/components/icons/LogoIcon';
import { getCurrentUserAction } from '@/logic/user';
import { logoutAction } from '@/logic/logout';
import { useEffect, useState } from 'react';

function NavItem({
    href,
    icon: Icon,
    label,
}: {
    href: string;
    icon: React.ElementType;
    label: string;
}) {
    const pathname = usePathname();
    const active = pathname === href;

    return (
        <Link href={href} className="group relative">
            <Button
                variant="ghost"
                className={`hover:bg-gray-100 dark:hover:bg-slate-800 px-2 sm:px-3 ${
                    active ? 'border-b-2 border-black dark:border-white' : ''
                }`}
            >
                <Icon className="h-5 w-5 sm:mr-2 text-black dark:text-slate-50" />
                <span className="hidden sm:inline text-black dark:text-slate-50">
                    {label}
                </span>
            </Button>
            <span
                className={`absolute bottom-0 left-0 h-[2px] bg-black dark:bg-slate-50 transition-all duration-300 ease-out ${
                    active ? 'w-full' : 'w-0 group-hover:w-full'
                }`}
            ></span>
        </Link>
    );
}

function useUser() {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        (async () => {
            const u = await getCurrentUserAction();
            setUser(u);
        })();
    }, []);

    return user;
}

function UserActions() {
    const user = useUser();

    if (user) {
        return (
            <div className="flex items-center gap-2">
                <span className="text-sm text-black dark:text-slate-300 hidden sm:inline">
                    Halo, {user.username} (
                    {user.role === 'admin' ? 'Admin' : 'Karyawan'})
                </span>
                {user.role === 'admin' && (
                    <NavItem
                        href="/admin/dashboard"
                        icon={ShieldCheck}
                        label="Dashboard"
                    />
                )}
                <form action={logoutAction} className="group relative">
                    <Button
                        variant="ghost"
                        size="sm"
                        type="submit"
                        className="hover:bg-gray-100 dark:hover:bg-slate-800 px-2"
                    >
                        <LogOut className="h-5 w-5 sm:mr-1 text-black dark:text-slate-50" />
                        <span className="hidden sm:inline text-black dark:text-slate-50">
                            Logout
                        </span>
                    </Button>
                    <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-black dark:bg-slate-50 transition-all duration-300 ease-out group-hover:w-full"></span>
                </form>
            </div>
        );
    }

    return (
        <Link href="/login" className="group relative">
            <Button
                variant="ghost"
                className="hover:bg-gray-100 dark:hover:bg-slate-800 px-2 sm:px-3"
            >
                <LogIn className="h-5 w-5 sm:mr-2 text-black dark:text-slate-50" />
                <span className="hidden sm:inline text-black dark:text-slate-50">
                    Login
                </span>
            </Button>
            <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-black dark:bg-slate-50 transition-all duration-300 ease-out group-hover:w-full"></span>
        </Link>
    );
}

export function Header() {
    const user = useUser();
    const pathname = usePathname();

    return (
        <header className="bg-white dark:bg-slate-900 shadow-md sticky top-0 z-40">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link
                    href={user?.role === 'admin' ? '/admin/dashboard' : '/'}
                    className="flex items-center gap-2 text-black dark:text-slate-50 hover:opacity-80 transition-opacity"
                >
                    <LogoIcon className="h-7 w-7" />
                    <h1 className="text-2xl font-bold tracking-tight">
                        Manajemen Iventory
                    </h1>
                </Link>
                <div className="flex items-center gap-1 sm:gap-2">
                    <nav className="flex items-center gap-1 sm:gap-2 mr-4">
                        {(!user || user.role !== 'admin') && (
                            <>
                                <NavItem href="/" icon={Home} label="Beranda" />
                                <NavItem
                                    href="/statistics"
                                    icon={BarChart4}
                                    label="Statistik"
                                />
                                <NavItem
                                    href="/defective-items"
                                    icon={AlertTriangle}
                                    label="Barang Cacat"
                                />
                            </>
                        )}
                    </nav>
                    <UserActions />
                </div>
            </div>
        </header>
    );
}
