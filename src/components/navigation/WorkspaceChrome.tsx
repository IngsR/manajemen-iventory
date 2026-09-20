"use client";

import { logoutAction } from "@/actions/AuthActions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/Utils";
import {
  Boxes,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { AdminNavbar } from "./AdminNavbar";
import { OfficerNavbar } from "./OfficerNavbar";
import { SupervisorNavbar } from "./SupervisorNavbar";

export type WorkspaceRole = "ADMIN" | "SUPERVISOR" | "PETUGAS";

interface WorkspaceChromeProps {
  role: WorkspaceRole;
  name: string;
  email: string;
  deskName: string;
  badgeLabel: string;
  badgeClass: string;
  children: React.ReactNode;
}

// Single stateful boundary for the authenticated workspace: owns the mobile
// drawer open/close flag so the server layout stays a pure RSC (no re-render
// of page content when the drawer toggles).
export function WorkspaceChrome({
  role,
  name,
  email,
  deskName,
  badgeLabel,
  badgeClass,
  children,
}: WorkspaceChromeProps) {
  // Desktop sidebar: collapsed = true hides it. Mobile drawer: open = true slides it in.
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const Navbar =
    role === "ADMIN"
      ? AdminNavbar
      : role === "SUPERVISOR"
        ? SupervisorNavbar
        : OfficerNavbar;

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-900 flex-col">
      {/* Glass Header */}
      <header className="glass-navbar sticky top-0 z-40 flex h-14 lg:h-16 w-full items-center justify-between gap-2 px-3 sm:px-4 lg:px-6">
        <div className="flex items-center gap-2 min-w-0">
          {/* Mobile sidebar trigger — opens the drawer overlay */}
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="lg:hidden h-9 w-9 rounded-xl text-slate-600 hover:bg-slate-100 shrink-0"
            aria-label="Buka menu navigasi"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Desktop sidebar trigger — collapses / expands the sidebar */}
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="hidden lg:inline-flex h-9 w-9 rounded-xl text-slate-600 hover:bg-slate-100 shrink-0"
            aria-label={collapsed ? "Tampilkan sidebar" : "Sembunyikan sidebar"}
            title={collapsed ? "Tampilkan sidebar" : "Sembunyikan sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </Button>

          <Link
            href="/"
            className="flex items-center gap-2.5 font-bold text-slate-900 group min-w-0"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md transition-transform duration-300 group-hover:scale-105 shrink-0">
              <Boxes className="h-5 w-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-base tracking-tight font-bold leading-none">
                StockFlow
              </span>
              <span className="hidden sm:block text-[10px] text-slate-400 font-medium tracking-wider mt-0.5 truncate">
                {deskName}
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-xs font-semibold text-slate-800">{name}</span>
            <span className="text-[11px] text-slate-400 font-mono">
              {email}
            </span>
          </div>

          <span
            className={cn(
              "hidden sm:inline text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider",
              badgeClass,
            )}
          >
            {badgeLabel}
          </span>

          <form action={logoutAction}>
            <Button
              variant="ghost"
              size="sm"
              type="submit"
              className="text-slate-500 hover:text-rose-600 hover:bg-rose-50/80 rounded-xl h-9 px-2 sm:px-3"
              title="Keluar / Logout"
            >
              <LogOut className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline text-xs font-medium">
                Logout
              </span>
            </Button>
          </form>
        </div>
      </header>

      {/* Layout Body: isolated role navbar + main content */}
      <div className="flex flex-1 min-h-[calc(100vh-3.5rem)] lg:min-h-[calc(100vh-4rem)]">
        {/* Desktop sidebar (collapsible) */}
        {!collapsed && <Navbar variant="desktop" />}

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 overflow-y-auto p-3 sm:p-5 lg:p-8">
          {children}
        </main>
      </div>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden transition-opacity duration-200",
          drawerOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Navigasi workspace"
      >
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)}
        />

        {/* Drawer panel */}
        <div
          className={cn(
            "absolute inset-y-0 left-0 w-[85%] max-w-xs glass-surface flex-col shadow-2xl transition-transform duration-300 ease-out",
            drawerOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/70">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md">
                <Boxes className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight leading-none">
                  StockFlow
                </span>
                <span className="text-[10px] text-slate-400 font-medium tracking-wider mt-0.5">
                  {deskName}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="h-9 w-9 rounded-xl text-slate-500 hover:bg-slate-100"
              aria-label="Tutup menu"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div
            className="flex-1 overflow-y-auto py-2"
            onClick={() => setDrawerOpen(false)}
          >
            <Navbar variant="mobile" />
          </div>

          <div className="px-4 py-3 border-t border-slate-200/70">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">
                  {name}
                </p>
                <p className="text-[10px] text-slate-400 font-mono truncate">
                  {email}
                </p>
              </div>
              <span
                className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0",
                  badgeClass,
                )}
              >
                {badgeLabel}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
