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
import type { InventoryItem } from '@/lib/types';
import { Edit3, Trash2, ArrowUpDown, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface InventoryTableProps {
    items: InventoryItem[];
    onEditItem: (item: InventoryItem) => void;
    onDeleteItem: (item: InventoryItem) => void;
}

type SortKey = keyof InventoryItem | null;

export function InventoryTable({
    items,
    onEditItem,
    onDeleteItem,
}: InventoryTableProps) {
    const [sortKey, setSortKey] = useState<SortKey>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
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
                    item.name
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    item.category
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    (item.location &&
                        item.location
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
            <ArrowUpDown
                className="ml-2 h-4 w-4 text-primary"
                data-testid="sort-asc"
            />
        ) : (
            <ArrowUpDown
                className="ml-2 h-4 w-4 text-primary"
                data-testid="sort-desc"
                style={{ transform: 'scaleY(-1)' }}
            />
        );
    };

    return (
        <Card className="shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="bg-card border-b p-4">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <CardTitle className="text-xl font-semibold text-foreground">
                        Inventaris Saat Ini
                    </CardTitle>
                    <div className="relative w-full sm:w-auto sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Cari item..."
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
                        <p className="text-lg">
                            Tidak ada item inventaris yang ditemukan.
                        </p>
                        {searchTerm && (
                            <p>
                                Coba sesuaikan istilah pencarian Anda atau
                                tambahkan item baru.
                            </p>
                        )}
                        {!searchTerm && (
                            <p>Tambahkan item baru untuk memulai.</p>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead
                                        className="cursor-pointer hover:bg-muted transition-colors w-[25%]"
                                        onClick={() => handleSort('name')}
                                    >
                                        <div className="flex items-center">
                                            Nama Item {renderSortIcon('name')}
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer hover:bg-muted transition-colors text-right w-[10%]"
                                        onClick={() => handleSort('quantity')}
                                    >
                                        <div className="flex items-center justify-end">
                                            Kuantitas{' '}
                                            {renderSortIcon('quantity')}
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer hover:bg-muted transition-colors w-[20%]"
                                        onClick={() => handleSort('category')}
                                    >
                                        <div className="flex items-center">
                                            Kategori{' '}
                                            {renderSortIcon('category')}
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer hover:bg-muted transition-colors w-[20%]"
                                        onClick={() => handleSort('location')}
                                    >
                                        <div className="flex items-center">
                                            Lokasi {renderSortIcon('location')}
                                        </div>
                                    </TableHead>
                                    <TableHead className="text-right w-[25%]">
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
                                        <TableCell className="font-medium text-foreground py-3">
                                            {item.name}
                                        </TableCell>
                                        <TableCell className="text-right py-3">
                                            {item.quantity}
                                        </TableCell>
                                        <TableCell className="py-3">
                                            {item.category}
                                        </TableCell>
                                        <TableCell className="py-3">
                                            {item.location || '-'}
                                        </TableCell>
                                        <TableCell className="text-right space-x-1 sm:space-x-2 py-3">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onEditItem(item)}
                                                aria-label={`Ubah kuantitas untuk ${item.name}`}
                                                className="hover:bg-secondary hover:border-primary/50"
                                            >
                                                <Edit3 className="h-4 w-4 mr-0 sm:mr-2" />
                                                <span className="hidden sm:inline">
                                                    Ubah
                                                </span>
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    onDeleteItem(item)
                                                }
                                                aria-label={`Hapus ${item.name}`}
                                                className="hover:bg-destructive/10 hover:border-destructive/50 text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4 mr-0 sm:mr-2" />
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
