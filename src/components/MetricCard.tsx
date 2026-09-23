import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/Utils';

interface MetricCardProps {
    title: string;
    value: string | number;
    description?: string;
    icon?: LucideIcon;
    badge?: string;
    variant?: 'default' | 'warning' | 'danger' | 'success' | 'indigo';
    className?: string;
}

const variantMap = {
    default: {
        icon: 'bg-blue-50 text-blue-600 border-blue-100',
        badge: 'bg-blue-50 text-blue-700 border-blue-200',
        glow: 'from-blue-500/10',
        dot: 'bg-blue-400',
    },
    indigo: {
        icon: 'bg-indigo-50 text-indigo-600 border-indigo-100',
        badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        glow: 'from-indigo-500/10',
        dot: 'bg-indigo-400',
    },
    warning: {
        icon: 'bg-amber-50 text-amber-600 border-amber-100',
        badge: 'bg-amber-50 text-amber-700 border-amber-200',
        glow: 'from-amber-500/10',
        dot: 'bg-amber-400',
    },
    danger: {
        icon: 'bg-rose-50 text-rose-600 border-rose-100',
        badge: 'bg-rose-50 text-rose-700 border-rose-200',
        glow: 'from-rose-500/10',
        dot: 'bg-rose-400',
    },
    success: {
        icon: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        glow: 'from-emerald-500/10',
        dot: 'bg-emerald-400',
    },
};

export function MetricCard({
    title,
    value,
    description,
    icon: Icon,
    badge,
    variant = 'default',
    className,
}: MetricCardProps) {
    const styles = variantMap[variant];

    return (
        <div
            className={cn(
                'relative overflow-hidden rounded-2xl bg-white p-6 group',
                'border border-[rgba(15,23,42,0.08)]',
                'shadow-[0_1px_2px_rgba(15,23,42,0.04),_0_4px_16px_rgba(15,23,42,0.06)]',
                'transition-all duration-250 ease-smooth',
                'hover:shadow-[0_4px_24px_rgba(15,23,42,0.10)]',
                'hover:-translate-y-[2px]',
                className
            )}
        >
            {/* Subtle background glow */}
            <div
                className={cn(
                    'absolute top-0 right-0 h-32 w-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-2xl',
                    `bg-gradient-to-bl ${styles.glow} to-transparent`
                )}
            />

            {/* Header: title + icon */}
            <div className="flex items-start justify-between gap-3 relative">
                <div className="space-y-0.5">
                    <p className="text-[13px] font-semibold text-slate-500 tracking-wide">{title}</p>
                </div>
                {Icon && (
                    <div className={cn('p-3 rounded-xl border shadow-sm shrink-0 transition-transform duration-300 group-hover:scale-105', styles.icon)}>
                        <Icon className="h-5 w-5" />
                    </div>
                )}
            </div>

            {/* Value */}
            <div className="relative mt-4 flex items-end justify-between gap-3">
                <div className="text-[2.25rem] font-black tracking-tight text-slate-900 leading-none">
                    {value}
                </div>
                {badge && (
                    <span
                        className={cn(
                            'text-[11px] font-bold px-2.5 py-1 rounded-full border shrink-0 mb-1',
                            styles.badge
                        )}
                    >
                        {badge}
                    </span>
                )}
            </div>

            {/* Description */}
            {description && (
                <p className="relative mt-2 text-[13px] text-slate-500 leading-relaxed">{description}</p>
            )}

            {/* Bottom accent line */}
            <div
                className={cn(
                    'absolute bottom-0 left-0 h-[3px] w-0 group-hover:w-full transition-all duration-400 ease-smooth rounded-b-2xl',
                    `bg-gradient-to-r ${styles.glow.replace('/10', '/60')} to-transparent`
                )}
            />
        </div>
    );
}
