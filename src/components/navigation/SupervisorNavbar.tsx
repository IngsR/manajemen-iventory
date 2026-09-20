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
            title: 'Alur Kerja Saya',
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
                'glass-surface flex-col justify-between p-4 z-20',
                variant === 'desktop'
                    ? 'hidden lg:flex lg:w-64 flex-shrink-0 border-r border-slate-200/80 min-h-[calc(100vh-4rem)] sticky top-16 self-start'
                    : 'flex w-full'
            )}
        >
            <div className="space-y-6">
                {/* Role Workspace Badge */}
                <div className="px-3 py-2 rounded-xl bg-amber-50/80 border border-amber-200/70 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-amber-600 shrink-0" />
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                            Supervisor Desk
                        </span>
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-amber-200/70 text-amber-900">
                        OVERSIGHT
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
                                                ? 'role-pill-supervisor-active font-semibold'
                                                : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                                        )}
                                    >
                                        <Icon className={cn('h-4 w-4 shrink-0', item.active ? 'text-white' : 'text-slate-500')} />
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
                    Supervisor Workspace • Isolated
                </span>
            </div>
        </aside>
    );
}
