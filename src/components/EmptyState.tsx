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
                'glass-surface-subtle flex flex-col items-center justify-center p-6 sm:p-10 text-center rounded-2xl border border-dashed border-slate-300/80 my-2',
                className
            )}
        >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/80 shadow-sm border border-slate-200/60 text-slate-400 mb-4 transition-transform hover:scale-105">
                <Icon className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800 tracking-tight">{title}</h3>
            {description && (
                <p className="mt-1.5 text-xs text-slate-500 max-w-md leading-relaxed">{description}</p>
            )}
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}
