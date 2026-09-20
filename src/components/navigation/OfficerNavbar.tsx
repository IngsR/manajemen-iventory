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
} from 'lucide-react';
import { cn } from '@/lib/Utils';

export function OfficerNavbar() {
    const pathname = usePathname();

    const sections = [
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
            title: 'Transaksi Fisik Barang',
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
                    label: 'Transfer Antar Lokasi',
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
                    label: 'Koreksi Stok (Adjustment)',
                    href: '/inventory/adjustment',
                    icon: SlidersHorizontal,
                    active: pathname.startsWith('/inventory/adjustment'),
                },
            ],
        },
        {
            title: 'Pencatatan Fisik & Log',
            items: [
                {
                    label: 'Input Hitung Opname',
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
            title: 'SOP & Edukasi',
            items: [
                {
                    label: 'Alur Kerja Sistem',
                    href: '/workflow',
                    icon: BookOpen,
                    active: pathname === '/workflow',
                },
            ],
        },
    ];

    return (
        <aside className="w-64 flex-shrink-0 glass-surface border-r border-slate-200/80 min-h-[calc(100vh-4.5rem)] flex flex-col justify-between p-4 z-20">
            <div className="space-y-6">
                {/* Role Workspace Badge */}
                <div className="px-3 py-2 rounded-xl bg-emerald-50/80 border border-emerald-200/70 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Boxes className="h-4 w-4 text-emerald-600" />
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                            Officer Station
                        </span>
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-emerald-200/70 text-emerald-900">
                        OPERATIONS
                    </span>
                </div>

                {/* Nav groups */}
                {sections.map((section, idx) => (
                    <div key={idx} className="space-y-1.5">
                        <h4 className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                            {section.title}
                        </h4>
                        <div className="space-y-1">
                            {section.items.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-all duration-200',
                                            item.active
                                                ? 'role-pill-petugas-active font-semibold'
                                                : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                                        )}
                                    >
                                        <Icon className={cn('h-4 w-4', item.active ? 'text-white' : 'text-slate-500')} />
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer Tag */}
            <div className="pt-4 border-t border-slate-200/60 text-center">
                <span className="text-[10px] font-medium text-slate-400">
                    Officer Workspace • Isolated
                </span>
            </div>
        </aside>
    );
}
