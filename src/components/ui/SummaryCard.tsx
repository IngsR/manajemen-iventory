// components/ui/SummaryCard.tsx
import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from './tooltip';

export interface SummaryCardProps {
    title: string;
    value: number;
    icon: ReactNode;
    color?: 'default' | 'destructive';
    tooltip?: string; // ← tambahkan ini
}

export function SummaryCard({
    title,
    value,
    icon,
    color = 'default',
    tooltip,
}: SummaryCardProps) {
    const valueColor =
        color === 'destructive' ? 'text-destructive' : 'text-accent';

    return (
        <Card>
            <CardHeader className="flex justify-between items-center pb-2">
                <CardTitle className="text-sm font-medium">
                    {tooltip ? (
                        <TooltipProvider delayDuration={100}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="cursor-help">{title}</span>
                                </TooltipTrigger>
                                <TooltipContent side="top" align="center">
                                    <p>{tooltip}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    ) : (
                        title
                    )}
                </CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <p className={`text-3xl font-bold ${valueColor}`}>{value}</p>
            </CardContent>
        </Card>
    );
}
