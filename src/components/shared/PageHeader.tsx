import React from 'react';
import Link from 'next/link';
import { LucideIcon, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/Utils';

export interface BreadcrumbItem {
    label: string;
    href?: string;
}

export interface PageHeaderProps {
    title: string;
    subtitle?: string;
    icon?: LucideIcon;
    badge?: {
        label: string;
        variant?: 'admin' | 'supervisor' | 'petugas' | 'neutral';
    };
    breadcrumbs?: BreadcrumbItem[];
    actions?: React.ReactNode;
    className?: string;
}

export function PageHeader({
    title,
    subtitle,
    icon: Icon,
    badge,
    breadcrumbs,
    actions,
    className,
}: PageHeaderProps) {
    const badgeStyles = {
        admin: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
        supervisor: 'bg-amber-50 text-amber-700 border-amber-200/80',
        petugas: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
        neutral: 'bg-slate-100 text-slate-700 border-slate-200/80',
    };

    return (
        <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6', className)}>
            <div className="space-y-1.5">
                {breadcrumbs && breadcrumbs.length > 0 && (
                    <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                        {breadcrumbs.map((crumb, idx) => {
                            const isLast = idx === breadcrumbs.length - 1;
                            return (
                                <React.Fragment key={idx}>
                                    {idx > 0 && <ChevronRight className="h-3 w-3 text-slate-300" />}
                                    {crumb.href && !isLast ? (
                                        <Link
                                            href={crumb.href}
                                            className="hover:text-slate-700 transition-colors"
                                        >
                                            {crumb.label}
                                        </Link>
                                    ) : (
                                        <span className={isLast ? 'font-medium text-slate-600' : ''}>
                                            {crumb.label}
                                        </span>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </nav>
                )}

                <div className="flex items-center gap-3">
                    {Icon && (
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200/80 shadow-sm text-slate-800">
                            <Icon className="h-5 w-5" />
                        </div>
                    )}
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                                {title}
                            </h1>
                            {badge && (
                                <span
                                    className={cn(
                                        'text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider',
                                        badgeStyles[badge.variant || 'neutral']
                                    )}
                                >
                                    {badge.label}
                                </span>
                            )}
                        </div>
                        {subtitle && (
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {actions && (
                <div className="flex items-center gap-2.5 shrink-0">
                    {actions}
                </div>
            )}
        </div>
    );
}
