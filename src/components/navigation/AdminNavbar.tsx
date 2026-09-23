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
    Users,
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
                {
                    label: 'Manajemen Pengguna',
                    href: '/users',
                    icon: Users,
                    active: pathname.startsWith('/users'),
                },
            ],
        },
        {
            title: 'Master Data',
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
                    label: 'Log Mutasi',
                    href: '/reports/movements',
                    icon: ScrollText,
                    active: pathname.startsWith('/reports/movements'),
                },
                {
                    label: 'Stok Rendah',
                    href: '/reports/low-stock',
                    icon: AlertTriangle,
                    active: pathname.startsWith('/reports/low-stock'),
                },
                {
                    label: 'Rekap Opname',
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
                'app-sidebar flex flex-col z-20',
                variant === 'desktop'
                    ? 'hidden lg:flex w-60 flex-shrink-0 min-h-[calc(100vh-4rem)] sticky top-16 self-start'
                    : 'flex w-full'
            )}
        >
            <div className="flex-1 overflow-y-auto py-3 space-y-5 px-3">
                {/* Role Identity Badge */}
                <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-indigo-500/15 border border-indigo-400/20">
                    <div className="h-7 w-7 rounded-lg bg-indigo-500/25 flex items-center justify-center shrink-0">
                        <ShieldCheck className="h-3.5 w-3.5 text-indigo-300" />
                    </div>
                    <div>
                        <p className="text-[13px] font-bold text-indigo-200 leading-none">Admin Console</p>
                        <p className="text-[10px] text-indigo-400/70 font-mono mt-0.5">GOVERNANCE</p>
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
                                        item.active && 'sidebar-item-active sidebar-item-active-admin'
                                    )}
                                >
                                    <Icon
                                        className={cn(
                                            'h-[18px] w-[18px] shrink-0',
                                            item.active ? 'text-indigo-300' : 'text-white/40'
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
                    Admin Workspace • StockFlow
                </p>
            </div>
        </aside>
    );
}
