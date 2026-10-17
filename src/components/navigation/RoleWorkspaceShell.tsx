import React from "react";
import Link from "next/link";
import { UserDoc } from "@/models/UserModel";
import { WorkspaceChrome, WorkspaceRole } from "./WorkspaceChrome";
import { Boxes } from "lucide-react";

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
  ADMIN: {
    label: "Admin",
    className: "role-badge-admin",
    deskName: "Panel Admin",
  },
  SUPERVISOR: {
    label: "Supervisor",
    className: "role-badge-supervisor",
    deskName: "Panel Supervisor",
  },
  PETUGAS: {
    label: "Petugas",
    className: "role-badge-petugas",
    deskName: "Panel Petugas",
  },
};

export function RoleWorkspaceShell({
  user,
  children,
}: RoleWorkspaceShellProps) {
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
