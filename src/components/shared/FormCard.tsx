import React from 'react';
import { cn } from '@/lib/Utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

export interface FormCardProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    children: React.ReactNode;
    footer?: React.ReactNode;
    className?: string;
}

export function FormCard({
    title,
    description,
    icon: Icon,
    children,
    footer,
    className,
}: FormCardProps) {
    return (
        <Card className={cn('glass-card border-slate-200/80 shadow-sm overflow-hidden', className)}>
            <CardHeader className="p-4 sm:p-5 border-b border-slate-100 bg-white/50">
                <div className="flex items-center gap-3">
                    {Icon && (
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm shrink-0">
                            <Icon className="h-4 w-4" />
                        </div>
                    )}
                    <div>
                        <CardTitle className="text-sm sm:text-base font-bold text-slate-800 tracking-tight">
                            {title}
                        </CardTitle>
                        {description && (
                            <CardDescription className="text-xs text-slate-500 mt-0.5">
                                {description}
                            </CardDescription>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-4">
                {children}
            </CardContent>
            {footer && (
                <CardFooter className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3 p-4 sm:p-5 border-t border-slate-100 bg-slate-50/50 [&>*]:w-full sm:[&>*]:w-auto">
                    {footer}
                </CardFooter>
            )}
        </Card>
    );
}
