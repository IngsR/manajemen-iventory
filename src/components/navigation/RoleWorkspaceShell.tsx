import React from 'react';
import Link from 'next/link';
import { UserDoc } from '@/models/UserModel';
import { logoutAction } from '@/actions/AuthActions';
import { AdminNavbar } from './AdminNavbar';
import { SupervisorNavbar } from './SupervisorNavbar';
import { OfficerNavbar } from './OfficerNavbar';
import { Boxes, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RoleWorkspaceShellProps {
    user: UserDoc | null;
    children: React.ReactNode;
}

export function RoleWorkspaceShell({ user, children }: RoleWorkspaceShellProps) {
    if (!user) {
        return (
            <div className="min-h-screen bg-[#f6f8fb] text-slate-900 flex flex-col">
                <header className="glass-navbar sticky top-0 z-40 flex h-16 w-full items-center justify-between px-6">
                    <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
                            <Boxes className="h-5 w-5" />
                        </div>
                        <span className="text-lg tracking-tight font-semibold">StockFlow</span>
                    </Link>
                </header>
                <main className="flex-1 flex items-center justify-center p-6">
                    {children}
                </main>
            </div>
        );
    }

    // Role-specific ambient glow background gradient
    const getRoleAmbientGlow = () => {
        switch (user.role) {
            case 'ADMIN':
                return 'from-indigo-100/40 via-transparent to-transparent';
            case 'SUPERVISOR':
                return 'from-amber-100/40 via-transparent to-transparent';
            case 'PETUGAS':
                return 'from-emerald-100/40 via-transparent to-transparent';
            default:
                return 'from-blue-100/40 via-transparent to-transparent';
        }
    };

    const getRoleBadge = () => {
        switch (user.role) {
            case 'ADMIN':
                return {
                    label: 'ADMINISTRATOR',
                    className: 'role-badge-admin',
                    deskName: 'Admin Control Desk',
                };
            case 'SUPERVISOR':
                return {
                    label: 'SUPERVISOR',
                    className: 'role-badge-supervisor',
                    deskName: 'Oversight & Verification',
                };
            case 'PETUGAS':
                return {
                    label: 'OFFICER / PETUGAS',
                    className: 'role-badge-petugas',
                    deskName: 'Warehouse Floor Terminal',
                };
        }
    };

    const badge = getRoleBadge();

    return (
        <div className="min-h-screen bg-[#f6f8fb] text-slate-900 flex flex-col relative overflow-hidden">
            {/* Ambient Apple Silicon Top-Right Glow */}
            <div
                className={`pointer-events-none absolute top-0 right-0 h-96 w-96 rounded-full bg-gradient-to-b ${getRoleAmbientGlow()} blur-3xl`}
            />

            {/* Glass Header */}
            <header className="glass-navbar sticky top-0 z-40 flex h-16 w-full items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <Link href="/" className="flex items-center gap-2.5 font-bold text-slate-900 group">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md transition-transform duration-300 group-hover:scale-105">
                            <Boxes className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-base tracking-tight font-bold leading-none">StockFlow</span>
                            <span className="text-[10px] text-slate-400 font-medium tracking-wider mt-0.5">
                                {badge.deskName}
                            </span>
                        </div>
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex flex-col items-end">
                        <span className="text-xs font-semibold text-slate-800">{user.name}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{user.email}</span>
                    </div>

                    <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${badge.className}`}
                    >
                        {badge.label}
                    </span>

                    <form action={logoutAction}>
                        <Button
                            variant="ghost"
                            size="sm"
                            type="submit"
                            className="text-slate-500 hover:text-rose-600 hover:bg-rose-50/80 rounded-xl h-9"
                            title="Keluar / Logout"
                        >
                            <LogOut className="h-4 w-4 mr-1.5" />
                            <span className="hidden sm:inline text-xs font-medium">Logout</span>
                        </Button>
                    </form>
                </div>
            </header>

            {/* Layout Body: Isolated Navbar + Main Content */}
            <div className="flex flex-1 min-h-[calc(100vh-4rem)]">
                {/* Render strictly isolated role navbar */}
                {user.role === 'ADMIN' && <AdminNavbar />}
                {user.role === 'SUPERVISOR' && <SupervisorNavbar />}
                {user.role === 'PETUGAS' && <OfficerNavbar />}

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto p-6 md:p-8 relative z-10">
                    {children}
                </main>
            </div>
        </div>
    );
}
