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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { DefectiveItemLogEntry, DefectiveItemStatus } from '@/lib/types';
import { ArrowUpDown, Search, Edit3, Trash2, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { id as IndonesianLocale } from 'date-fns/locale';

interface DefectiveItemsTableProps {
    items: DefectiveItemLogEntry[];
    onUpdateStatus: (item: DefectiveItemLogEntry) => void;
    onDeleteLog: (item: DefectiveItemLogEntry) => void;
    onViewDetails?: (item: DefectiveItemLogEntry) => void;
}

type SortKey = keyof DefectiveItemLogEntry | 'inventory_item_name' | null;

export function DefectiveItemsTable({
    items,
    onUpdateStatus,
    onDeleteLog,
    onViewDetails,
}: DefectiveItemsTableProps) {
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

    const filteredAndSortedItems = useMemo(() => {
        let sortedItems = [...items];
        if (sortKey) {
            sortedItems.sort((a, b) => {
                const valA = a[sortKey];
                const valB = b[sortKey];

                if (valA === null || valA === undefined)
                    return sortOrder === 'asc' ? 1 : -1;
                if (valB === null || valB === undefined)
                    return sortOrder === 'asc' ? -1 : 1;

                if (sortKey === 'logged_at' || sortKey === 'updated_at') {
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
            return sortedItems.filter(
                (item) =>
                    item.inventory_item_name
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    item.item_name_at_log_time
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    item.reason
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    item.status
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    (item.notes &&
                        item.notes
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase())),
            );
        }
        return sortedItems;
    }, [items, sortKey, sortOrder, searchTerm]);

    const renderSortIcon = (key: SortKey) => {
        if (sortKey !== key)
            return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
        return sortOrder === 'asc' ? (
            <ArrowUpDown className="ml-2 h-4 w-4 text-primary" />
        ) : (
            <ArrowUpDown
                className="ml-2 h-4 w-4 text-primary"
                style={{ transform: 'scaleY(-1)' }}
            />
        );
    };

    const getStatusBadgeVariant = (status: DefectiveItemStatus) => {
        switch (status) {
            case 'Pending Review':
                return 'default';
            case 'Returned to Supplier':
                return 'secondary';
            case 'Disposed':
                return 'destructive';
            case 'Repaired':
                return 'outline';
            case 'Awaiting Parts':
                return 'default';
            default:
                return 'default';
        }
    };

    return (
        <Card className="shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="bg-card border-b p-4">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <CardTitle className="text-xl font-semibold text-foreground">
                        Log Barang Cacat
                    </CardTitle>
                    <div className="relative w-full sm:w-auto sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Cari log..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-background border-border focus:ring-primary w-full"
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {filteredAndSortedItems.length === 0 ? (
                    <div className="text-center p-10 text-muted-foreground">
                        <p className="text-lg">Tidak ada log barang cacat.</p>
                        {searchTerm && (
                            <p>Coba sesuaikan istilah pencarian Anda.</p>
                        )}
                        {!searchTerm && (
                            <p>Catat barang cacat baru untuk memulai.</p>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead
                                        className="cursor-pointer hover:bg-muted transition-colors w-[20%]"
                                        onClick={() => handleSort('logged_at')}
                                    >
                                        <div className="flex items-center">
                                            Tgl Dicatat{' '}
                                            {renderSortIcon('logged_at')}
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer hover:bg-muted transition-colors w-[25%]"
                                        onClick={() =>
                                            handleSort('inventory_item_name')
                                        }
                                    >
                                        <div className="flex items-center">
                                            Nama Item{' '}
                                            {renderSortIcon(
                                                'inventory_item_name',
                                            )}
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer hover:bg-muted transition-colors text-right w-[10%]"
                                        onClick={() =>
                                            handleSort('quantity_defective')
                                        }
                                    >
                                        <div className="flex items-center justify-end">
                                            Jml Cacat{' '}
                                            {renderSortIcon(
                                                'quantity_defective',
                                            )}
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer hover:bg-muted transition-colors w-[15%]"
                                        onClick={() => handleSort('reason')}
                                    >
                                        <div className="flex items-center">
                                            Alasan {renderSortIcon('reason')}
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer hover:bg-muted transition-colors w-[15%]"
                                        onClick={() => handleSort('status')}
                                    >
                                        <div className="flex items-center">
                                            Status {renderSortIcon('status')}
                                        </div>
                                    </TableHead>
                                    <TableHead className="text-right w-[15%]">
                                        Aksi
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAndSortedItems.map((item) => (
                                    <TableRow
                                        key={item.id}
                                        className="hover:bg-muted/20 transition-colors"
                                    >
                                        <TableCell className="py-3 text-xs">
                                            {format(
                                                new Date(item.logged_at),
                                                'dd MMM yy, HH:mm',
                                                { locale: IndonesianLocale },
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium text-foreground py-3">
                                            {item.inventory_item_name}
                                            {item.inventory_item_name !==
                                                item.item_name_at_log_time && (
                                                <p className="text-xs text-muted-foreground italic">
                                                    (Nama saat log:{' '}
                                                    {item.item_name_at_log_time}
                                                    )
                                                </p>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right py-3">
                                            {item.quantity_defective}
                                        </TableCell>
                                        <TableCell className="py-3 text-sm">
                                            {item.reason}
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <Badge
                                                variant={getStatusBadgeVariant(
                                                    item.status as DefectiveItemStatus,
                                                )}
                                                className="text-xs"
                                            >
                                                {item.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right space-x-1 sm:space-x-2 py-3">
                                            {onViewDetails && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        onViewDetails(item)
                                                    }
                                                    aria-label={`Lihat detail untuk log ${item.id}`}
                                                    className="hover:bg-secondary hover:border-primary/50"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    onUpdateStatus(item)
                                                }
                                                aria-label={`Perbarui status untuk log ${item.id}`}
                                                className="hover:bg-secondary hover:border-primary/50"
                                            >
                                                <Edit3 className="h-4 w-4 mr-0 sm:mr-1" />
                                                <span className="hidden sm:inline">
                                                    Status
                                                </span>
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    onDeleteLog(item)
                                                }
                                                aria-label={`Hapus log ${item.id}`}
                                                className="hover:bg-destructive/10 hover:border-destructive/50 text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4 mr-0 sm:mr-1" />
                                                <span className="hidden sm:inline">
                                                    Hapus
                                                </span>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
