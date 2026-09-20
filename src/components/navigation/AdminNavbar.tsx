'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Package,
    Warehouse,
    MapPin,
    Tags,
    Ruler,
    ShieldAlert,
    ScrollText,
    AlertTriangle,
    FileSpreadsheet,
    ShieldCheck,
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

interface AdminNavbarProps {
    variant?: 'desktop' | 'mobile';
}

export function AdminNavbar({ variant = 'desktop' }: AdminNavbarProps) {
    const pathname = usePathname();

    const sections: NavSection[] = [
        {
            title: 'Tata Kelola',
            items: [
                {
                    label: 'Admin Overview',
                    href: '/dashboard/admin',
                    icon: LayoutDashboard,
                    active: pathname === '/dashboard/admin' || pathname === '/',
                },
            ],
        },
        {
            title: 'Master Data Entitas',
            items: [
                {
                    label: 'Barang & SKU',
                    href: '/items',
                    icon: Package,
                    active: pathname.startsWith('/items'),
                },
                {
                    label: 'Fasilitas Gudang',
                    href: '/warehouses',
                    icon: Warehouse,
                    active: pathname.startsWith('/warehouses'),
                },
                {
                    label: 'Zona & Rak Lokasi',
                    href: '/locations',
                    icon: MapPin,
                    active: pathname.startsWith('/locations'),
                },
                {
                    label: 'Kategori Produk',
                    href: '/categories',
                    icon: Tags,
                    active: pathname.startsWith('/categories'),
                },
                {
                    label: 'Satuan Ukuran',
                    href: '/units',
                    icon: Ruler,
                    active: pathname.startsWith('/units'),
                },
            ],
        },
        {
            title: 'Audit & Analitik',
            items: [
                {
                    label: 'Sistem Audit Trail',
                    href: '/audit',
                    icon: ShieldAlert,
                    active: pathname.startsWith('/audit'),
                },
                {
                    label: 'Log Riwayat Mutasi',
                    href: '/reports/movements',
                    icon: ScrollText,
                    active: pathname.startsWith('/reports/movements'),
                },
                {
                    label: 'Peringatan Stok Rendah',
                    href: '/reports/low-stock',
                    icon: AlertTriangle,
                    active: pathname.startsWith('/reports/low-stock'),
                },
                {
                    label: 'Rekapitulasi Opname',
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
                    label: 'Workflow Admin',
                    href: '/workflow/admin',
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
                <div className="px-3 py-2 rounded-xl bg-indigo-50/80 border border-indigo-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-indigo-600 shrink-0" />
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">
                            Admin Console
                        </span>
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-indigo-200/60 text-indigo-800">
                        GOVERNANCE
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
                                                ? 'role-pill-admin-active font-semibold'
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
                    Admin Workspace • Isolated
                </span>
            </div>
        </aside>
    );
}
