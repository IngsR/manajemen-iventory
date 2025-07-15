'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { fetchInventoryItemsAction } from '@/logic/iventory';
import { fetchDefectiveItemsLogAction } from '@/logic/defective-items';
import type { InventoryItem, DefectiveItemLogEntry } from '@/lib/types';
import ChartCard from '@/components/ui/ChartCard';

interface CategoryStatData {
    category: string;
    uniqueItemCount: number;
    totalQuantity: number;
}

interface LocationStatData {
    location: string;
    uniqueItemCount: number;
    totalQuantity: number;
}

interface DefectiveReasonData {
    reason: string;
    count: number;
}

interface DefectiveStatusData {
    status: string;
    count: number;
}

interface AdminChartData {
    itemsPerCategory: CategoryStatData[];
    itemsPerLocation: LocationStatData[];
    defectiveItemsByReason: DefectiveReasonData[];
    defectiveItemsByStatus: DefectiveStatusData[];
}

const POLLING_INTERVAL = 60000;

export default function AdminChartsClient() {
    const [chartData, setChartData] = useState<AdminChartData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    const mountedRef = useRef(true);
    const isMobile = useIsMobile();
    const currentYear = new Date().getFullYear();

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const loadChartData = useCallback(
        async (isPolling = false) => {
            if (!isPolling) setIsLoading(true);
            setError(null);

            try {
                const [items, logs]: [
                    InventoryItem[],
                    DefectiveItemLogEntry[],
                ] = await Promise.all([
                    fetchInventoryItemsAction(),
                    fetchDefectiveItemsLogAction(),
                ]);

                if (!mountedRef.current) return;

                const categoryMap: Record<
                    string,
                    { ids: Set<number>; qty: number }
                > = {};
                const locationMap: Record<
                    string,
                    { ids: Set<number>; qty: number }
                > = {};

                items.forEach((item) => {
                    const cat = item.category;
                    const loc = item.location || 'Tidak Ditentukan';

                    if (!categoryMap[cat])
                        categoryMap[cat] = { ids: new Set(), qty: 0 };
                    if (!locationMap[loc])
                        locationMap[loc] = { ids: new Set(), qty: 0 };

                    categoryMap[cat].ids.add(item.id);
                    categoryMap[cat].qty += item.quantity;

                    locationMap[loc].ids.add(item.id);
                    locationMap[loc].qty += item.quantity;
                });

                const itemsPerCategory = Object.entries(categoryMap).map(
                    ([k, v]) => ({
                        category: k,
                        uniqueItemCount: v.ids.size,
                        totalQuantity: v.qty,
                    }),
                );

                const itemsPerLocation = Object.entries(locationMap).map(
                    ([k, v]) => ({
                        location: k,
                        uniqueItemCount: v.ids.size,
                        totalQuantity: v.qty,
                    }),
                );

                const reasonCount: Record<string, number> = {};
                const statusCount: Record<string, number> = {};

                logs.forEach((log) => {
                    reasonCount[log.reason] =
                        (reasonCount[log.reason] || 0) + log.quantity_defective;
                    statusCount[log.status] =
                        (statusCount[log.status] || 0) + log.quantity_defective;
                });

                const defectiveItemsByReason = Object.entries(reasonCount).map(
                    ([reason, count]) => ({
                        reason,
                        count,
                    }),
                );

                const defectiveItemsByStatus = Object.entries(statusCount).map(
                    ([status, count]) => ({
                        status,
                        count,
                    }),
                );

                setChartData({
                    itemsPerCategory,
                    itemsPerLocation,
                    defectiveItemsByReason,
                    defectiveItemsByStatus,
                });
            } catch (err) {
                const msg =
                    err instanceof Error ? err.message : 'Gagal memuat data.';
                setError(msg);
                if (!isPolling) {
                    toast({
                        title: 'Kesalahan Memuat Data',
                        description: msg,
                        variant: 'destructive',
                    });
                }
            } finally {
                if (!isPolling) setIsLoading(false);
            }
        },
        [toast],
    );

    useEffect(() => {
        loadChartData();
        const id = setInterval(() => {
            if (mountedRef.current) loadChartData(true);
        }, POLLING_INTERVAL);
        return () => clearInterval(id);
    }, [loadChartData]);

    if (isLoading && !chartData) {
        return (
            <div className="flex justify-center items-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-sm">Memuat data statistik...</span>
            </div>
        );
    }

    if (error && !chartData) {
        return (
            <div className="text-center p-6 bg-red-50 text-red-600 rounded-md">
                <AlertTriangle className="mx-auto mb-3 h-6 w-6" />
                <p className="font-semibold text-lg">Gagal Memuat Statistik</p>
                <p className="text-sm">{error}</p>
                <Button
                    onClick={() => loadChartData()}
                    variant="outline"
                    className="mt-4 border-red-600 text-red-600 hover:bg-red-100"
                >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Coba Lagi
                </Button>
            </div>
        );
    }

    if (!chartData) return null;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10">
                <h1 className="text-4xl font-bold text-primary text-center sm:text-left">
                    Statistik Inventaris
                </h1>
                <Button
                    onClick={() => loadChartData()}
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

            <div
                className={`grid gap-6 ${
                    isMobile ? 'grid-cols-1' : 'grid-cols-2'
                }`}
            >
                <ChartCard
                    title="Item per Kategori"
                    description="Distribusi item unik & kuantitas berdasarkan kategori."
                    data={chartData.itemsPerCategory}
                    yAxisKey="category"
                    dataKeys={[
                        {
                            key: 'totalQuantity',
                            color: 'hsl(var(--chart-2))',
                            label: 'Total',
                        },
                    ]}
                />
                <ChartCard
                    title="Item per Lokasi"
                    description="Distribusi item unik & kuantitas berdasarkan lokasi."
                    data={chartData.itemsPerLocation}
                    yAxisKey="location"
                    dataKeys={[
                        {
                            key: 'totalQuantity',
                            color: 'hsl(var(--chart-2))',
                            label: 'Total',
                        },
                    ]}
                />
            </div>

            <h2 className="text-xl font-semibold mb-6 mt-10">Barang Cacat</h2>
            <div
                className={`grid gap-6 ${
                    isMobile ? 'grid-cols-1' : 'grid-cols-2'
                }`}
            >
                <ChartCard
                    title="Unit Cacat per Alasan"
                    description="Distribusi berdasarkan alasan barang cacat."
                    data={chartData.defectiveItemsByReason}
                    yAxisKey="reason"
                    dataKeys={[
                        {
                            key: 'count',
                            color: 'hsl(var(--chart-1))',
                            label: 'Jumlah Unit',
                        },
                    ]}
                />
                <ChartCard
                    title="Unit Cacat per Status"
                    description="Distribusi berdasarkan status barang cacat."
                    data={chartData.defectiveItemsByStatus}
                    yAxisKey="status"
                    dataKeys={[
                        {
                            key: 'count',
                            color: 'hsl(var(--chart-1))',
                            label: 'Jumlah Unit',
                        },
                    ]}
                />
            </div>
        </div>
    );
}
