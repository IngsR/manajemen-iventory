import React from 'react';
import { cn } from '@/lib/Utils';

export interface StatusDotProps {
    variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
    label?: string;
    pulse?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function StatusDot({
    variant = 'neutral',
    label,
    pulse = false,
    size = 'md',
    className,
}: StatusDotProps) {
    const dotColors = {
        success: 'bg-emerald-500 shadow-emerald-500/30',
        warning: 'bg-amber-500 shadow-amber-500/30',
        danger: 'bg-rose-500 shadow-rose-500/30',
        info: 'bg-blue-500 shadow-blue-500/30',
        neutral: 'bg-slate-400 shadow-slate-400/30',
    };

    const pulseColors = {
        success: 'bg-emerald-400',
        warning: 'bg-amber-400',
        danger: 'bg-rose-400',
        info: 'bg-blue-400',
        neutral: 'bg-slate-300',
    };

    const sizeClasses = {
        sm: 'h-1.5 w-1.5',
        md: 'h-2 w-2',
        lg: 'h-2.5 w-2.5',
    };

    return (
        <span className={cn('inline-flex items-center gap-1.5', className)}>
            <span className="relative flex h-2 w-2 items-center justify-center">
                {pulse && (
                    <span
                        className={cn(
                            'absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping',
                            pulseColors[variant]
                        )}
                    />
                )}
                <span
                    className={cn(
                        'relative inline-flex rounded-full shadow-sm',
                        sizeClasses[size],
                        dotColors[variant]
                    )}
                />
            </span>
            {label && (
                <span className="text-xs font-medium text-slate-700">
                    {label}
                </span>
            )}
        </span>
    );
}
