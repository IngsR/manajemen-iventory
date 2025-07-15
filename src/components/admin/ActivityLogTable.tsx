'use client';

import { useState, useMemo } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { ActivityLog } from '@/lib/types';
import { ArrowUpDown, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { id as IndonesianLocale } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface ActivityLogTableProps {
    logs: ActivityLog[];
}

type SortKey = keyof ActivityLog | null;

export function ActivityLogTable({ logs }: ActivityLogTableProps) {
    const [sortKey, setSortKey] = useState<SortKey>('logged_at');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [searchTerm, setSearchTerm] = useState('');

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortOrder('asc');
        }
    };

    const filteredAndSortedLogs = useMemo(() => {
        let sortedLogs = [...logs];
        if (sortKey) {
            sortedLogs.sort((a, b) => {
                const valA = a[sortKey];
                const valB = b[sortKey];

                if (valA === null || valA === undefined)
                    return sortOrder === 'asc' ? 1 : -1;
                if (valB === null || valB === undefined)
                    return sortOrder === 'asc' ? -1 : 1;

                if (sortKey === 'logged_at') {
                    return sortOrder === 'asc'
                        ? new Date(valA as string).getTime() -
                              new Date(valB as string).getTime()
                        : new Date(valB as string).getTime() -
                              new Date(valA as string).getTime();
                }
                if (typeof valA === 'string' && typeof valB === 'string') {
                    return sortOrder === 'asc'
                        ? valA.localeCompare(valB)
                        : valB.localeCompare(valA);
                }
                if (typeof valA === 'number' && typeof valB === 'number') {
                    return sortOrder === 'asc' ? valA - valB : valB - valA;
                }
                return 0;
            });
        }

        if (searchTerm) {
            const lowerSearchTerm = searchTerm.toLowerCase();
            return sortedLogs.filter(
                (log) =>
                    log.username_at_log_time
                        .toLowerCase()
                        .includes(lowerSearchTerm) ||
                    log.action.toLowerCase().includes(lowerSearchTerm) ||
                    (log.details &&
                        log.details.toLowerCase().includes(lowerSearchTerm)),
            );
        }
        return sortedLogs;
    }, [logs, sortKey, sortOrder, searchTerm]);

    const renderSortIcon = (key: SortKey) => {
        if (sortKey !== key)
            return <ArrowUpDown className="ml-2 h-3 w-3 opacity-40" />;
        return sortOrder === 'asc' ? (
            <ArrowUpDown className="ml-2 h-3 w-3 text-primary" />
        ) : (
            <ArrowUpDown
                className="ml-2 h-3 w-3 text-primary"
                style={{ transform: 'scaleY(-1)' }}
            />
        );
    };

    return (
        <div className="space-y-4">
            <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Cari dalam log (username, aksi, detail)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-background border-border focus:ring-primary w-full text-sm"
                />
            </div>

            {filteredAndSortedLogs.length === 0 ? (
                <div className="text-center p-10 text-muted-foreground">
                    <p className="text-lg">
                        {searchTerm
                            ? 'Tidak ada log yang cocok.'
                            : 'Belum ada aktivitas tercatat.'}
                    </p>
                    {searchTerm && (
                        <p>Coba sesuaikan istilah pencarian Anda.</p>
                    )}
                </div>
            ) : (
                <ScrollArea className="h-[60vh] border rounded-md">
                    <Table>
                        <TableHeader className="bg-muted/50 sticky top-0 z-10">
                            <TableRow>
                                <TableHead
                                    className="cursor-pointer hover:bg-muted transition-colors w-[15%]"
                                    onClick={() => handleSort('logged_at')}
                                >
                                    <div className="flex items-center text-xs sm:text-sm">
                                        Waktu {renderSortIcon('logged_at')}
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer hover:bg-muted transition-colors w-[15%]"
                                    onClick={() =>
                                        handleSort('username_at_log_time')
                                    }
                                >
                                    <div className="flex items-center text-xs sm:text-sm">
                                        Pengguna{' '}
                                        {renderSortIcon('username_at_log_time')}
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer hover:bg-muted transition-colors w-[30%]"
                                    onClick={() => handleSort('action')}
                                >
                                    <div className="flex items-center text-xs sm:text-sm">
                                        Aksi {renderSortIcon('action')}
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer hover:bg-muted transition-colors w-[40%]"
                                    onClick={() => handleSort('details')}
                                >
                                    <div className="flex items-center text-xs sm:text-sm">
                                        Detail {renderSortIcon('details')}
                                    </div>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAndSortedLogs.map((log) => (
                                <TableRow
                                    key={log.id}
                                    className="hover:bg-muted/20 transition-colors text-xs sm:text-sm"
                                >
                                    <TableCell className="py-2.5 align-top">
                                        {format(
                                            new Date(log.logged_at),
                                            'dd MMM yy, HH:mm:ss',
                                            { locale: IndonesianLocale },
                                        )}
                                    </TableCell>
                                    <TableCell className="font-medium text-foreground py-2.5 align-top">
                                        {log.username_at_log_time}
                                        {log.user_id !== null && (
                                            <Badge
                                                variant="outline"
                                                className="ml-2 text-xs"
                                            >
                                                ID:{' '}
                                                {String(log.user_id).substring(
                                                    0,
                                                    8,
                                                )}
                                                {String(log.user_id).length > 8
                                                    ? '...'
                                                    : ''}
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="py-2.5 align-top">
                                        {log.action}
                                    </TableCell>
                                    <TableCell className="py-2.5 align-top whitespace-pre-wrap break-words max-w-sm">
                                        <TooltipProvider>
                                            <Tooltip delayDuration={300}>
                                                <TooltipTrigger asChild>
                                                    <span className="truncate block max-w-xs hover:whitespace-normal">
                                                        {log.details || '-'}
                                                    </span>
                                                </TooltipTrigger>
                                                {log.details &&
                                                    log.details.length > 50 && ( // Show tooltip only if text is long
                                                        <TooltipContent
                                                            side="top"
                                                            align="start"
                                                            className="max-w-md bg-popover text-popover-foreground p-2 rounded shadow-lg border text-xs"
                                                        >
                                                            <p className="whitespace-pre-wrap break-words">
                                                                {log.details}
                                                            </p>
                                                        </TooltipContent>
                                                    )}
                                            </Tooltip>
                                        </TooltipProvider>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
            )}
        </div>
    );
}
