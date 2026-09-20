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

export function MetricCard({
    title,
    value,
    description,
    icon: Icon,
    badge,
    variant = 'default',
    className,
}: MetricCardProps) {
    const variantStyles = {
        default: 'text-blue-600 bg-blue-50/80 border-blue-200/60',
        indigo: 'text-indigo-600 bg-indigo-50/80 border-indigo-200/60',
        warning: 'text-amber-600 bg-amber-50/80 border-amber-200/60',
        danger: 'text-rose-600 bg-rose-50/80 border-rose-200/60',
        success: 'text-emerald-600 bg-emerald-50/80 border-emerald-200/60',
    };

    return (
        <div
            className={cn(
                'glass-card rounded-2xl p-5 relative overflow-hidden group',
                className
            )}
        >
            {/* Top row: Title and Icon */}
            <div className="flex items-center justify-between pb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {title}
                </span>
                {Icon && (
                    <div
                        className={cn(
                            'p-2.5 rounded-xl border shadow-sm transition-transform duration-300 group-hover:scale-105',
                            variantStyles[variant]
                        )}
                    >
                        <Icon className="h-4 w-4" />
                    </div>
                )}
            </div>

            {/* Middle: Big Metric Value */}
            <div className="flex items-baseline justify-between pt-1">
                <div className="text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
                    {value}
                </div>
                {badge && (
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100/90 text-slate-700 border border-slate-200/60 backdrop-blur-sm">
                        {badge}
                    </span>
                )}
            </div>

            {/* Bottom: Description */}
            {description && (
                <p className="text-xs text-slate-500 mt-2 font-normal leading-relaxed">
                    {description}
                </p>
            )}

            {/* Apple-style subtle bottom glow line */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
    );
}
