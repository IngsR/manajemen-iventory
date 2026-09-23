'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    ClipboardCheck,
    AlertTriangle,
    ScrollText,
    ShieldAlert,
    FileSpreadsheet,
    Eye,
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

interface SupervisorNavbarProps {
    variant?: 'desktop' | 'mobile';
}

export function SupervisorNavbar({ variant = 'desktop' }: SupervisorNavbarProps) {
    const pathname = usePathname();

    const sections: NavSection[] = [
        {
            title: 'Pusat Pengawasan',
            items: [
                {
                    label: 'Supervisor Overview',
                    href: '/dashboard/supervisor',
                    icon: LayoutDashboard,
                    active: pathname === '/dashboard/supervisor' || pathname === '/',
                },
            ],
        },
        {
            title: 'Verifikasi & Approval',
            items: [
                {
                    label: 'Antrean Stock Opname',
                    href: '/inventory/stock-opname',
                    icon: ClipboardCheck,
                    active: pathname.startsWith('/inventory/stock-opname'),
                },
                {
                    label: 'Monitoring Stok Kritis',
                    href: '/reports/low-stock',
                    icon: AlertTriangle,
                    active: pathname.startsWith('/reports/low-stock'),
                },
            ],
        },
        {
            title: 'Audit & Pemeriksaan',
            items: [
                {
                    label: 'Buku Besar Mutasi',
                    href: '/reports/movements',
                    icon: ScrollText,
                    active: pathname.startsWith('/reports/movements'),
                },
                {
                    label: 'Histori Log Audit',
                    href: '/audit',
                    icon: ShieldAlert,
                    active: pathname.startsWith('/audit'),
                },
                {
                    label: 'Rekap Stock Opname',
                    href: '/reports/opnames',
                    icon: FileSpreadsheet,
                    active: pathname.startsWith('/reports/opnames'),
                },
            ],
        },
        {
            title: 'Alur Kerja',
            items: [
                {
                    label: 'Workflow Supervisor',
                    href: '/workflow/supervisor',
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
                <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-amber-500/15 border border-amber-400/20">
                    <div className="h-7 w-7 rounded-lg bg-amber-500/25 flex items-center justify-center shrink-0">
                        <Eye className="h-3.5 w-3.5 text-amber-300" />
                    </div>
                    <div>
                        <p className="text-[13px] font-bold text-amber-200 leading-none">Supervisor Desk</p>
                        <p className="text-[10px] text-amber-400/70 font-mono mt-0.5">OVERSIGHT</p>
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
                                        item.active && 'sidebar-item-active sidebar-item-active-supv'
                                    )}
                                >
                                    <Icon
                                        className={cn(
                                            'h-[18px] w-[18px] shrink-0',
                                            item.active ? 'text-amber-300' : 'text-white/40'
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
                    Supervisor Workspace • StockFlow
                </p>
            </div>
        </aside>
    );
}
