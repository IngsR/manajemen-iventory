import React from 'react';
import Link from 'next/link';
import { UserDoc } from '@/models/UserModel';
import { WorkspaceChrome, WorkspaceRole } from './WorkspaceChrome';
import { Boxes } from 'lucide-react';

interface RoleWorkspaceShellProps {
    user: UserDoc | null;
    children: React.ReactNode;
}

interface RoleMeta {
    label: string;
    className: string;
    deskName: string;
}

// Role identity descriptor — single lookup, no nested switches.
const ROLE_META: Record<WorkspaceRole, RoleMeta> = {
    ADMIN: { label: 'ADMINISTRATOR', className: 'role-badge-admin', deskName: 'Admin Control Desk' },
    SUPERVISOR: { label: 'SUPERVISOR', className: 'role-badge-supervisor', deskName: 'Oversight & Verification' },
    PETUGAS: { label: 'OFFICER / PETUGAS', className: 'role-badge-petugas', deskName: 'Warehouse Floor Terminal' },
};

export function RoleWorkspaceShell({ user, children }: RoleWorkspaceShellProps) {
    if (!user) {
        return (
            <div className="min-h-screen bg-[#f6f8fb] text-slate-900 flex flex-col">
                <header className="glass-navbar sticky top-0 z-40 flex h-14 w-full items-center justify-between px-4 sm:px-6">
                    <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
                            <Boxes className="h-5 w-5" />
                        </div>
                        <span className="text-lg tracking-tight font-semibold">StockFlow</span>
                    </Link>
                </header>
                <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
                    {children}
                </main>
            </div>
        );
    }

    const meta = ROLE_META[user.role as WorkspaceRole];

    return (
        <WorkspaceChrome
            role={user.role as WorkspaceRole}
            name={user.name}
            email={user.email}
            deskName={meta.deskName}
            badgeLabel={meta.label}
            badgeClass={meta.className}
        >
            {children}
        </WorkspaceChrome>
    );
}
