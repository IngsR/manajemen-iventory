'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    ArrowDownToLine,
    ArrowUpFromLine,
    ArrowLeftRight,
    RotateCcw,
    SlidersHorizontal,
    ClipboardPen,
    ScrollText,
    Boxes,
    BookOpen,
    type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/Utils';

interface NavItem {
    label: string;
    href: string;
    icon: LucideIcon;
    active: boolean;
}

interface NavSection {
    title: string;
    items: NavItem[];
}

interface OfficerNavbarProps {
    variant?: 'desktop' | 'mobile';
}

export function OfficerNavbar({ variant = 'desktop' }: OfficerNavbarProps) {
    const pathname = usePathname();

    const sections: NavSection[] = [
        {
            title: 'Lantai Operasi',
            items: [
                {
                    label: 'Terminal Petugas',
                    href: '/dashboard/petugas',
                    icon: LayoutDashboard,
                    active: pathname === '/dashboard/petugas' || pathname === '/',
                },
            ],
        },
        {
            title: 'Transaksi Barang',
            items: [
                {
                    label: 'Penerimaan (Receive)',
                    href: '/inventory/receive',
                    icon: ArrowDownToLine,
                    active: pathname.startsWith('/inventory/receive'),
                },
                {
                    label: 'Pengeluaran (Issue)',
                    href: '/inventory/issue',
                    icon: ArrowUpFromLine,
                    active: pathname.startsWith('/inventory/issue'),
                },
                {
                    label: 'Transfer Lokasi',
                    href: '/inventory/transfer',
                    icon: ArrowLeftRight,
                    active: pathname.startsWith('/inventory/transfer'),
                },
                {
                    label: 'Retur Barang',
                    href: '/inventory/return',
                    icon: RotateCcw,
                    active: pathname.startsWith('/inventory/return'),
                },
                {
                    label: 'Koreksi Stok',
                    href: '/inventory/adjustment',
                    icon: SlidersHorizontal,
                    active: pathname.startsWith('/inventory/adjustment'),
                },
            ],
        },
        {
            title: 'Pencatatan & Log',
            items: [
                {
                    label: 'Input Opname',
                    href: '/inventory/stock-opname',
                    icon: ClipboardPen,
                    active: pathname.startsWith('/inventory/stock-opname'),
                },
                {
                    label: 'Histori Transaksi',
                    href: '/reports/movements',
                    icon: ScrollText,
                    active: pathname.startsWith('/reports/movements'),
                },
            ],
        },
        {
            title: 'Alur Kerja',
            items: [
                {
                    label: 'Workflow Petugas',
                    href: '/workflow/petugas',
                    icon: BookOpen,
                    active: pathname.startsWith('/workflow'),
                },
            ],
        },
    ];

    return (
        <aside
            className={cn(
                'app-sidebar flex flex-col z-20',
                variant === 'desktop'
                    ? 'hidden lg:flex w-60 flex-shrink-0 min-h-[calc(100vh-4rem)] sticky top-16 self-start'
                    : 'flex w-full'
            )}
        >
            <div className="flex-1 overflow-y-auto py-3 space-y-5 px-3">
                {/* Role Identity Badge */}
                <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-400/20">
                    <div className="h-7 w-7 rounded-lg bg-emerald-500/25 flex items-center justify-center shrink-0">
                        <Boxes className="h-3.5 w-3.5 text-emerald-300" />
                    </div>
                    <div>
                        <p className="text-[13px] font-bold text-emerald-200 leading-none">Officer Station</p>
                        <p className="text-[10px] text-emerald-400/70 font-mono mt-0.5">OPERATIONS</p>
                    </div>
                </div>

                {/* Nav Sections */}
                {sections.map((section, idx) => (
                    <div key={idx} className="space-y-1">
                        <p className="sidebar-section-label px-3 mb-2">{section.title}</p>
                        {section.items.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        'sidebar-item',
                                        item.active && 'sidebar-item-active sidebar-item-active-petug'
                                    )}
                                >
                                    <Icon
                                        className={cn(
                                            'h-[18px] w-[18px] shrink-0',
                                            item.active ? 'text-emerald-300' : 'text-white/40'
                                        )}
                                    />
                                    <span className="truncate">{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-white/07">
                <p className="text-[11px] text-white/25 font-medium text-center">
                    Officer Workspace • StockFlow
                </p>
            </div>
        </aside>
    );
}
