import React from 'react';
import { LucideIcon, PackageOpen } from 'lucide-react';
import { cn } from '@/lib/Utils';

interface EmptyStateProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    action?: React.ReactNode;
    className?: string;
}

export function EmptyState({
    title,
    description,
    icon: Icon = PackageOpen,
    action,
    className,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center p-8 sm:p-12 text-center',
                'rounded-2xl border border-dashed border-slate-200 bg-slate-50/50',
                className
            )}
        >
            {/* Icon circle */}
            <div className="relative mb-5">
                <div className="h-16 w-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center transition-transform duration-300 hover:scale-105">
                    <Icon className="h-7 w-7 text-slate-400" />
                </div>
                {/* Subtle glow ring */}
                <div className="absolute inset-0 rounded-2xl bg-slate-100 blur-xl opacity-60 -z-10 scale-110" />
            </div>

            <h3 className="text-base font-bold text-slate-800 tracking-tight">{title}</h3>

            {description && (
                <p className="mt-2 text-[13px] text-slate-500 max-w-xs leading-relaxed">
                    {description}
                </p>
            )}

            {action && <div className="mt-6">{action}</div>}
        </div>
    );
}
