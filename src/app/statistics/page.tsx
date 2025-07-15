'use client';

import {
    PieChart as PieChartIcon,
    LineChart,
    DivideSquare,
    AlertTriangle,
    RefreshCw,
    Loader2,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import ChartCard from '@/components/ui/ChartCard';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { fetchInventoryItemsAction } from '@/logic/iventory';
import { fetchDefectiveItemsLogAction } from '@/logic/defective-items';
import type { InventoryItem, DefectiveItemLogEntry } from '@/lib/types';
import { InteractiveSummaryCard } from '@/components/admin/InteractiveSummaryCard';

interface StatisticsData {
    totalUniqueItemTypes: number;
    totalStockQuantity: number;
    averageQuantityPerItemType: number;
    totalDefectiveItems: number;
    itemsPerCategory: {
        category: string;
        uniqueItemCount: number;
        totalQuantity: number;
    }[];
    itemsPerLocation: {
        location: string;
        uniqueItemCount: number;
        totalQuantity: number;
    }[];
    defectiveItemsByReason: { reason: string; count: number }[];
    defectiveItemsByStatus: { status: string; count: number }[];
}

const POLLING_INTERVAL = 60000;

export default function StatisticsPage() {
    const [stats, setStats] = useState<StatisticsData | null>(null);
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    const [defectiveLogs, setDefectiveLogs] = useState<DefectiveItemLogEntry[]>(
        [],
    );
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const isMobile = useIsMobile();
    const { toast } = useToast();
    const mountedRef = useRef(true);

    const loadStats = useCallback(
        async (isPolling = false) => {
            if (!isPolling) setIsLoading(true);
            setError(null);

            try {
                const [items, logs] = (await Promise.all([
                    fetchInventoryItemsAction(),
                    fetchDefectiveItemsLogAction(),
                ])) as [InventoryItem[], DefectiveItemLogEntry[]];

                if (!mountedRef.current) return;

                setInventoryItems(items);
                setDefectiveLogs(logs);

                const uniqueItems = new Set(items.map((i) => i.name));
                const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);
                const avgQty = uniqueItems.size
                    ? parseFloat((totalQty / uniqueItems.size).toFixed(2))
                    : 0;

                const catAgg = items.reduce((acc, item) => {
                    acc[item.category] ??= { u: new Set(), q: 0 };
                    acc[item.category].u.add(item.id);
                    acc[item.category].q += item.quantity;
                    return acc;
                }, {} as Record<string, { u: Set<number>; q: number }>);

                const itemsPerCategory = Object.entries(catAgg).map(
                    ([category, d]) => ({
                        category,
                        uniqueItemCount: d.u.size,
                        totalQuantity: d.q,
                    }),
                );

                const locAgg = items.reduce((acc, item) => {
                    const loc = item.location || 'Tidak Ditentukan';
                    acc[loc] ??= { u: new Set(), q: 0 };
                    acc[loc].u.add(item.id);
                    acc[loc].q += item.quantity;
                    return acc;
                }, {} as Record<string, { u: Set<number>; q: number }>);

                const itemsPerLocation = Object.entries(locAgg).map(
                    ([location, d]) => ({
                        location,
                        uniqueItemCount: d.u.size,
                        totalQuantity: d.q,
                    }),
                );

                const reasonAgg = logs.reduce((acc, log) => {
                    acc[log.reason] =
                        (acc[log.reason] || 0) + log.quantity_defective;
                    return acc;
                }, {} as Record<string, number>);

                const defectiveItemsByReason = Object.entries(reasonAgg).map(
                    ([reason, count]) => ({
                        reason,
                        count,
                    }),
                );

                const statusAgg = logs.reduce((acc, log) => {
                    acc[log.status] =
                        (acc[log.status] || 0) + log.quantity_defective;
                    return acc;
                }, {} as Record<string, number>);

                const defectiveItemsByStatus = Object.entries(statusAgg).map(
                    ([status, count]) => ({
                        status,
                        count,
                    }),
                );

                setStats({
                    totalUniqueItemTypes: uniqueItems.size,
                    totalStockQuantity: totalQty,
                    averageQuantityPerItemType: avgQty,
                    totalDefectiveItems: logs.reduce(
                        (s, l) => s + l.quantity_defective,
                        0,
                    ),
                    itemsPerCategory,
                    itemsPerLocation,
                    defectiveItemsByReason,
                    defectiveItemsByStatus,
                });
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                setError(msg);
                toast({
                    title: 'Gagal Memuat Statistik',
                    description: msg,
                    variant: 'destructive',
                });
            } finally {
                if (!isPolling) setIsLoading(false);
            }
        },
        [toast],
    );

    useEffect(() => {
        mountedRef.current = true;
        loadStats();
        const iv = setInterval(
            () => mountedRef.current && loadStats(true),
            POLLING_INTERVAL,
        );
        return () => {
            mountedRef.current = false;
            clearInterval(iv);
        };
    }, [loadStats]);

    if (isLoading && !stats) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <span className="ml-4 text-muted-foreground">
                    Memuat data statistik...
                </span>
            </div>
        );
    }

    if (error && !stats) {
        return (
            <div className="text-center py-20">
                <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-destructive">
                    Gagal memuat data
                </h2>
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button
                    onClick={() => loadStats()}
                    variant="outline"
                    className="mt-4 border-destructive text-destructive hover:bg-destructive/10"
                >
                    <RefreshCw className="mr-2 h-4 w-4" /> Coba Lagi
                </Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10">
                <h1 className="text-4xl font-bold text-primary">
                    Laporan Statistik Inventaris
                </h1>
                <Button
                    onClick={() => loadStats()}
                    disabled={isLoading}
                    variant="outline"
                    className="mt-4 sm:mt-0 border-primary text-primary hover:bg-primary/5"
                >
                    <RefreshCw
                        className={`mr-2 h-4 w-4 ${
                            isLoading ? 'animate-spin' : ''
                        }`}
                    />
                    Refresh
                </Button>
            </div>

            {/* Ringkasan Interaktif */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-10">
                <InteractiveSummaryCard
                    title="Jenis Item Unik"
                    value={stats!.totalUniqueItemTypes}
                    icon={<PieChartIcon className="h-5 w-5 text-primary" />}
                    description="Daftar jenis item yang berbeda."
                    data={inventoryItems}
                    previewType="uniqueItemNames"
                />
                <InteractiveSummaryCard
                    title="Total Kuantitas"
                    value={stats!.totalStockQuantity}
                    icon={<LineChart className="h-5 w-5 text-primary" />}
                    description="Kuantitas total semua stok item."
                    data={inventoryItems}
                    previewType="itemsWithQuantity"
                />
                <InteractiveSummaryCard
                    title="Rata-rata per Jenis"
                    value={stats!.averageQuantityPerItemType}
                    icon={<DivideSquare className="h-5 w-5 text-primary" />}
                    description="Rata-rata stok tiap jenis item."
                    data={inventoryItems}
                    previewType="itemsWithQuantity"
                />
                <InteractiveSummaryCard
                    title="Barang Cacat"
                    value={stats!.totalDefectiveItems}
                    icon={
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                    }
                    color="destructive"
                    description="Item cacat berdasarkan log kerusakan."
                    data={defectiveLogs}
                    previewType="defectiveItemNames"
                />
            </div>

            {/* Grafik */}
            <div
                className={`grid gap-6 ${
                    isMobile ? 'grid-cols-1' : 'grid-cols-2'
                }`}
            >
                <ChartCard
                    title="Item per Kategori"
                    description="Jumlah jenis dan kuantitas item per kategori."
                    data={stats!.itemsPerCategory}
                    yAxisKey="category"
                    dataKeys={[
                        {
                            key: 'totalQuantity',
                            color: 'hsl(var(--chart-2))',
                            label: 'Total',
                        },
                        {
                            key: 'uniqueItemCount',
                            color: 'hsl(var(--chart-1))',
                            label: 'Jenis',
                        },
                    ]}
                />
                <ChartCard
                    title="Item per Lokasi"
                    description="Jumlah jenis dan kuantitas item per lokasi."
                    data={stats!.itemsPerLocation}
                    yAxisKey="location"
                    dataKeys={[
                        {
                            key: 'totalQuantity',
                            color: 'hsl(var(--chart-2))',
                            label: 'Total',
                        },
                        {
                            key: 'uniqueItemCount',
                            color: 'hsl(var(--chart-1))',
                            label: 'Jenis',
                        },
                    ]}
                />
                <ChartCard
                    title="Barang Cacat per Alasan"
                    description="Distribusi cacat berdasarkan alasan kerusakan."
                    data={stats!.defectiveItemsByReason}
                    yAxisKey="reason"
                    dataKeys={[
                        {
                            key: 'count',
                            color: 'hsl(var(--chart-1))',
                            label: 'Jumlah',
                        },
                    ]}
                />
                <ChartCard
                    title="Barang Cacat per Status"
                    description="Distribusi cacat berdasarkan status penanganan."
                    data={stats!.defectiveItemsByStatus}
                    yAxisKey="status"
                    dataKeys={[
                        {
                            key: 'count',
                            color: 'hsl(var(--chart-1))',
                            label: 'Jumlah',
                        },
                    ]}
                />
            </div>
        </div>
    );
}
