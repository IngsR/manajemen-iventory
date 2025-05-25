import Link from 'next/link';
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
import { getCurrentUserAction, logoutAction } from '@/app/actions';

async function UserActions() {
    const user = await getCurrentUserAction();

    if (user) {
        return (
            <div className="flex items-center gap-2">
                <span className="text-sm text-black dark:text-slate-300 hidden sm:inline">
                    Halo, {user.username} (
                    {user.role === 'admin' ? 'Admin' : 'Karyawan'})
                </span>
                {user.role === 'admin' && (
                    <Link href="/admin/dashboard" className="group relative">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-gray-100 dark:hover:bg-slate-800 px-2"
                        >
                            <ShieldCheck className="h-5 w-5 sm:mr-1 text-black dark:text-slate-50 group-hover:text-black dark:group-hover:text-slate-50" />
                            <span className="hidden sm:inline text-black dark:text-slate-50 group-hover:text-black dark:group-hover:text-slate-50">
                                Panel Admin
                            </span>
                        </Button>
                        <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-black dark:bg-slate-50 transition-all duration-300 ease-out group-hover:w-full"></span>
                    </Link>
                )}
                <form action={logoutAction} className="group relative">
                    <Button
                        variant="ghost"
                        size="sm"
                        type="submit"
                        className="hover:bg-gray-100 dark:hover:bg-slate-800 px-2"
                    >
                        <LogOut className="h-5 w-5 sm:mr-1 text-black dark:text-slate-50 group-hover:text-black dark:group-hover:text-slate-50" />
                        <span className="hidden sm:inline text-black dark:text-slate-50 group-hover:text-black dark:group-hover:text-slate-50">
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
                <LogIn className="h-5 w-5 sm:mr-2 text-black dark:text-slate-50 group-hover:text-black dark:group-hover:text-slate-50" />
                <span className="hidden sm:inline text-black dark:text-slate-50 group-hover:text-black dark:group-hover:text-slate-50">
                    Login
                </span>
            </Button>
            <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-black dark:bg-slate-50 transition-all duration-300 ease-out group-hover:w-full"></span>
        </Link>
    );
}

export async function Header() {
    const user = await getCurrentUserAction();

    return (
        <header className="bg-white dark:bg-slate-900 shadow-md sticky top-0 z-40">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link
                    href={user?.role === 'admin' ? '/admin/dashboard' : '/'}
                    className="flex items-center gap-2 text-black dark:text-slate-50 hover:opacity-80 transition-opacity"
                >
                    <LogoIcon className="h-7 w-7" />
                    <h1 className="text-2xl font-bold tracking-tight">
                        Stockpile
                    </h1>
                </Link>
                <div className="flex items-center gap-1 sm:gap-2">
                    <nav className="flex items-center gap-1 sm:gap-2 mr-4">
                        {(!user || user.role !== 'admin') && (
                            <>
                                <Link href="/" className="group relative">
                                    <Button
                                        variant="ghost"
                                        className="hover:bg-gray-100 dark:hover:bg-slate-800 px-2 sm:px-3"
                                    >
                                        <Home className="h-5 w-5 sm:mr-2 text-black dark:text-slate-50 group-hover:text-black dark:group-hover:text-slate-50" />
                                        <span className="hidden sm:inline text-black dark:text-slate-50 group-hover:text-black dark:group-hover:text-slate-50">
                                            Beranda
                                        </span>
                                    </Button>
                                    <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-black dark:bg-slate-50 transition-all duration-300 ease-out group-hover:w-full"></span>
                                </Link>
                                <Link
                                    href="/statistics"
                                    className="group relative"
                                >
                                    <Button
                                        variant="ghost"
                                        className="hover:bg-gray-100 dark:hover:bg-slate-800 px-2 sm:px-3"
                                    >
                                        <BarChart4 className="h-5 w-5 sm:mr-2 text-black dark:text-slate-50 group-hover:text-black dark:group-hover:text-slate-50" />
                                        <span className="hidden sm:inline text-black dark:text-slate-50 group-hover:text-black dark:group-hover:text-slate-50">
                                            Statistik
                                        </span>
                                    </Button>
                                    <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-black dark:bg-slate-50 transition-all duration-300 ease-out group-hover:w-full"></span>
                                </Link>
                                <Link
                                    href="/defective-items"
                                    className="group relative"
                                >
                                    <Button
                                        variant="ghost"
                                        className="hover:bg-gray-100 dark:hover:bg-slate-800 px-2 sm:px-3"
                                    >
                                        <AlertTriangle className="h-5 w-5 sm:mr-2 text-black dark:text-slate-50 group-hover:text-black dark:group-hover:text-slate-50" />
                                        <span className="hidden sm:inline text-black dark:text-slate-50 group-hover:text-black dark:group-hover:text-slate-50">
                                            Barang Cacat
                                        </span>
                                    </Button>
                                    <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-black dark:bg-slate-50 transition-all duration-300 ease-out group-hover:w-full"></span>
                                </Link>
                            </>
                        )}
                    </nav>
                    <UserActions />
                </div>
            </div>
        </header>
    );
}
