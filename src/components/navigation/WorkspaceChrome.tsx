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

export function WorkspaceChrome({
  role,
  name,
  email,
  deskName,
  badgeLabel,
  badgeClass,
  children,
}: WorkspaceChromeProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const Navbar =
    role === "ADMIN"
      ? AdminNavbar
      : role === "SUPERVISOR"
        ? SupervisorNavbar
        : OfficerNavbar;

  // Avatar initials
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* ── Dark Header ─────────────────────────────────────────────────── */}
      <header className="app-header sticky top-0 z-40 flex h-16 w-full items-center justify-between gap-3 px-4 lg:px-6">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="lg:hidden h-9 w-9 rounded-xl flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Buka menu navigasi"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Desktop sidebar toggle */}
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="hidden lg:flex h-9 w-9 rounded-xl items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label={collapsed ? "Tampilkan sidebar" : "Sembunyikan sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </button>

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group min-w-0"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500 text-white shadow-lg transition-transform duration-200 group-hover:scale-105 shrink-0">
              <Boxes className="h-4 w-4" />
            </div>
            <div className="flex flex-col min-w-0 leading-none">
              <span className="text-white font-bold text-[15px] tracking-tight">
                StockFlow
              </span>
              <span className="hidden sm:block text-white/40 text-[11px] font-medium tracking-wider truncate mt-0.5">
                {deskName}
              </span>
            </div>
          </Link>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* User info - hidden on small screens */}
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[13px] font-semibold text-white leading-none">{name}</span>
            <span className="text-[11px] text-white/40 font-mono mt-0.5 leading-none">{email}</span>
          </div>

          {/* Role badge */}
          <span className={cn("hidden sm:inline text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider", badgeClass)}>
            {badgeLabel}
          </span>

          {/* Avatar */}
          <div className="h-8 w-8 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {initials}
          </div>

          {/* Logout */}
          <form action={logoutAction}>
            <Button
              variant="ghost"
              size="sm"
              type="submit"
              className="text-white/60 hover:text-white hover:bg-white/10 rounded-xl h-9 px-2.5 text-[13px]"
              title="Keluar"
            >
              <LogOut className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline font-medium">Logout</span>
            </Button>
          </form>
        </div>
      </header>

      {/* ── Body: Sidebar + Content ──────────────────────────────────────── */}
      <div className="flex flex-1 min-h-[calc(100vh-4rem)]">
        {/* Desktop sidebar */}
        {!collapsed && (
          <div className="hidden lg:block">
            <Navbar variant="desktop" />
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 lg:p-8 animate-fade-up">
          {children}
        </main>
      </div>

      {/* ── Mobile Drawer ────────────────────────────────────────────────── */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden transition-all duration-300",
          drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Navigasi workspace"
      >
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)}
        />

        {/* Drawer panel */}
        <div
          className={cn(
            "absolute inset-y-0 left-0 w-[280px] app-sidebar flex flex-col shadow-2xl",
            "transition-transform duration-300 ease-smooth",
            drawerOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {/* Drawer header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-white/07">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500 text-white shadow-md">
                <Boxes className="h-4 w-4" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-white font-bold text-[15px] tracking-tight">StockFlow</span>
                <span className="text-white/40 text-[11px] font-medium tracking-wider mt-0.5">{deskName}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="h-8 w-8 rounded-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Tutup menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Nav items */}
          <div
            className="flex-1 overflow-y-auto py-3"
            onClick={() => setDrawerOpen(false)}
          >
            <Navbar variant="mobile" />
          </div>

          {/* User footer */}
          <div className="px-4 py-3 border-t border-white/07">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-white text-sm font-bold shrink-0">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-white truncate">{name}</p>
                <p className="text-[11px] text-white/40 font-mono truncate">{email}</p>
              </div>
              <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0", badgeClass)}>
                {badgeLabel}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
