'use client';

import { useState, useRef, useEffect } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { InventoryItem, DefectiveItemLogEntry, User } from '@/lib/types';

interface InteractiveSummaryCardProps {
    title: string;
    color?: string;
    value: number | string;
    description: string;
    icon: React.ReactNode;
    data: any[];
    previewType:
        | 'uniqueItemNames'
        | 'itemsWithQuantity'
        | 'defectiveItemNames'
        | 'userNames';
}

// PREVIEW_ITEM_LIMIT removed

export function InteractiveSummaryCard({
    title,
    value,
    description,
    icon,
    data,
    previewType,
}: InteractiveSummaryCardProps) {
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const openTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handleMouseEnter = () => {
        if (isMobile) return;
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
        openTimeoutRef.current = setTimeout(() => {
            setIsPopoverOpen(true);
        }, 150);
    };

    const handleMouseLeave = () => {
        if (isMobile) return;
        if (openTimeoutRef.current) {
            clearTimeout(openTimeoutRef.current);
            openTimeoutRef.current = null;
        }
        closeTimeoutRef.current = setTimeout(() => {
            setIsPopoverOpen(false);
        }, 300);
    };

    const handleClick = () => {
        setIsPopoverOpen((prev) => !prev);
        if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
        if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };

    let previewContent: React.ReactNode = (
        <p className="text-sm text-muted-foreground">
            Tidak ada data pratinjau.
        </p>
    );
    // remainingItemsCount removed

    if (data && data.length > 0) {
        // displayData will now be the full data array
        const displayData = data;
        // remainingItemsCount logic removed

        switch (previewType) {
            case 'uniqueItemNames':
                const uniqueNames = Array.from(
                    new Set(
                        (displayData as InventoryItem[]).map(
                            (item) => item.name,
                        ),
                    ),
                );
                previewContent =
                    uniqueNames.length > 0 ? (
                        <ul className="space-y-1">
                            {uniqueNames.map((name, index) => (
                                <li key={index} className="text-sm truncate">
                                    {name}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            Tidak ada jenis item unik.
                        </p>
                    );
                break;
            case 'itemsWithQuantity':
                previewContent = (
                    <ul className="space-y-1">
                        {(displayData as InventoryItem[]).map((item) => (
                            <li key={item.id} className="text-sm truncate">
                                {item.name} (Stok: {item.quantity})
                            </li>
                        ))}
                    </ul>
                );
                break;
            case 'defectiveItemNames':
                previewContent = (
                    <ul className="space-y-1">
                        {(displayData as DefectiveItemLogEntry[]).map((log) => (
                            <li key={log.id} className="text-sm truncate">
                                {log.item_name_at_log_time} (Cacat:{' '}
                                {log.quantity_defective}, Status: {log.status})
                            </li>
                        ))}
                    </ul>
                );
                break;
            case 'userNames':
                previewContent = (
                    <ul className="space-y-1">
                        {(displayData as User[]).map((user) => (
                            <li key={user.id} className="text-sm truncate">
                                {user.username} (Peran: {user.role})
                            </li>
                        ))}
                    </ul>
                );
                break;
            default:
                previewContent = (
                    <p className="text-sm text-muted-foreground">
                        Tipe pratinjau tidak dikenal.
                    </p>
                );
        }
    }

    return (
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger
                asChild
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={handleClick}
            >
                <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer h-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            {title}
                        </CardTitle>
                        {icon}
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">
                            {value}
                        </div>
                        <p className="text-xs text-muted-foreground pt-1">
                            {description}
                        </p>
                    </CardContent>
                </Card>
            </PopoverTrigger>
            <PopoverContent
                className="w-80 z-50 bg-card border shadow-lg rounded-md"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                side="bottom"
                align="start"
                avoidCollisions={true}
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <div className="p-4">
                    <h4 className="font-medium leading-none text-foreground mb-2">
                        Detail untuk: {title}
                    </h4>
                    <ScrollArea className="h-[180px] w-full pr-3">
                        {previewContent}
                        {/* Removed remainingItemsCount display logic */}
                    </ScrollArea>
                    {/* Removed the instruction text div */}
                </div>
            </PopoverContent>
        </Popover>
    );
}
