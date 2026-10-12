import React from 'react';
import { cn } from '@/lib/Utils';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { EmptyState } from '@/components/EmptyState';
import { LucideIcon, PackageOpen } from 'lucide-react';

export interface DataTableProps {
    title?: string;
    description?: string;
    badgeCount?: number;
    actions?: React.ReactNode;
    emptyIcon?: LucideIcon;
    emptyTitle?: string;
    emptyDescription?: string;
    emptyAction?: React.ReactNode;
    dataLength: number;
    children: React.ReactNode;
    className?: string;
}

export function DataTable({
    title,
    description,
    badgeCount,
    actions,
    emptyIcon = PackageOpen,
    emptyTitle = 'Tidak ada data',
    emptyDescription = 'Belum ada catatan yang tersimpan untuk kriteria ini.',
    emptyAction,
    dataLength,
    children,
    className,
}: DataTableProps) {
    return (
        <Card className={cn('glass-card border-slate-200/80 overflow-hidden shadow-sm', className)}>
            {(title || actions) && (
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 sm:p-5 border-b border-slate-100 bg-white/50">
                    <div>
                        <div className="flex items-center gap-2">
                            {title && (
                                <CardTitle className="text-sm sm:text-base font-bold text-slate-800 tracking-tight">
                                    {title}
                                </CardTitle>
                            )}
                            {typeof badgeCount === 'number' && (
                                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60">
                                    {badgeCount}
                                </span>
                            )}
                        </div>
                        {description && (
                            <CardDescription className="text-xs text-slate-500 mt-0.5">
                                {description}
                            </CardDescription>
                        )}
                    </div>
                    {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
                </CardHeader>
            )}

            {dataLength === 0 ? (
                <div className="p-6">
                    <EmptyState
                        title={emptyTitle}
                        description={emptyDescription}
                        icon={emptyIcon}
                        action={emptyAction}
                    />
                </div>
            ) : (
                <div className="w-full overflow-x-auto">
                    {children}
                </div>
            )}
        </Card>
    );
}
