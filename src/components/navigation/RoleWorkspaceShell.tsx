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
        // Login page is full-screen split layout — render bare
        return <>{children}</>;
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
