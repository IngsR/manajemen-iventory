'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
    Bar,
    BarChart as RechartsBarChart,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import {
    ChartContainer,
    ChartTooltipContent,
    type ChartConfig,
    ChartLegend,
    ChartLegendContent,
} from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    BarChart4,
    MapPin,
    ListChecks,
    Loader2,
    AlertTriangle,
    PackageSearch,
    RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    fetchInventoryItemsAction,
    fetchDefectiveItemsLogAction,
} from '@/app/actions';
import type { InventoryItem, DefectiveItemLogEntry } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

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

const initialChartConfig: ChartConfig = {
    uniqueItemCount: {
        label: 'Jenis Item',
        color: 'hsl(var(--chart-1))',
    },
    totalQuantity: {
        label: 'Total Kuantitas',
        color: 'hsl(var(--chart-2))',
    },
    count: {
        label: 'Jumlah Unit',
        color: 'hsl(var(--chart-3))',
    },
    category: {
        label: 'Kategori',
    },
    location: {
        label: 'Lokasi',
    },
    reason: {
        label: 'Alasan Cacat',
    },
    status: {
        label: 'Status Cacat',
    },
} satisfies ChartConfig;

// Custom Tooltip for Inventory Charts (Category & Location) on Admin Dashboard
const CustomAdminInventoryTooltipContent = ({
    active,
    payload,
    label,
    chartConfig,
}: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload; // Full data object for the bar
        const yAxisLabel = data.category
            ? chartConfig.category.label
            : chartConfig.location.label;

        return (
            <div className="rounded-lg border bg-background p-2.5 shadow-xl text-xs">
                <p className="font-medium mb-1.5">
                    {yAxisLabel}: {label}
                </p>
                <div className="space-y-1">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center">
                            <span
                                style={{
                                    display: 'inline-block',
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '2px',
                                    backgroundColor:
                                        'var(--color-totalQuantity)',
                                    marginRight: '4px',
                                }}
                            ></span>
                            <span>{chartConfig.totalQuantity.label}:</span>
                        </div>
                        <span className="font-medium">
                            {data.totalQuantity.toLocaleString()}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center">
                            <span
                                style={{
                                    display: 'inline-block',
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '2px',
                                    backgroundColor:
                                        'var(--color-uniqueItemCount)',
                                    marginRight: '4px',
                                }}
                            ></span>
                            <span>{chartConfig.uniqueItemCount.label}:</span>
                        </div>
                        <span className="font-medium">
                            {data.uniqueItemCount.toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

const POLLING_INTERVAL_ADMIN_CHARTS = 60000; // 60 seconds

export default function AdminChartsClient() {
    const [chartData, setChartData] = useState<AdminChartData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const mountedRef = useRef(true);
    const { toast } = useToast();

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
                const [inventoryItemsResult, defectiveLogsResult] =
                    await Promise.all([
                        fetchInventoryItemsAction(),
                        fetchDefectiveItemsLogAction(),
                    ]);

                if (!mountedRef.current) return;

                const inventoryItemsForCharts = inventoryItemsResult;
                const defectiveLogsForCharts = defectiveLogsResult;

                const categoryStats: {
                    [key: string]: {
                        uniqueItems: Set<number>;
                        totalQty: number;
                    };
                } = {};
                inventoryItemsForCharts.forEach((item) => {
                    if (!categoryStats[item.category]) {
                        categoryStats[item.category] = {
                            uniqueItems: new Set(),
                            totalQty: 0,
                        };
                    }
                    categoryStats[item.category].uniqueItems.add(item.id);
                    categoryStats[item.category].totalQty += item.quantity;
                });
                const itemsPerCategoryData = Object.entries(categoryStats)
                    .map(([category, data]) => ({
                        category,
                        uniqueItemCount: data.uniqueItems.size,
                        totalQuantity: data.totalQty,
                    }))
                    .sort(
                        (a, b) =>
                            b.totalQuantity - a.totalQuantity ||
                            b.uniqueItemCount - a.uniqueItemCount,
                    );

                const locationStats: {
                    [key: string]: {
                        uniqueItems: Set<number>;
                        totalQty: number;
                    };
                } = {};
                inventoryItemsForCharts.forEach((item) => {
                    const locationName = item.location || 'Tidak Ditentukan';
                    if (!locationStats[locationName]) {
                        locationStats[locationName] = {
                            uniqueItems: new Set(),
                            totalQty: 0,
                        };
                    }
                    locationStats[locationName].uniqueItems.add(item.id);
                    locationStats[locationName].totalQty += item.quantity;
                });
                const itemsPerLocationData = Object.entries(locationStats)
                    .map(([location, data]) => ({
                        location,
                        uniqueItemCount: data.uniqueItems.size,
                        totalQuantity: data.totalQty,
                    }))
                    .sort(
                        (a, b) =>
                            b.totalQuantity - a.totalQuantity ||
                            b.uniqueItemCount - a.uniqueItemCount,
                    );

                const reasonCounts: { [key: string]: number } = {};
                defectiveLogsForCharts.forEach((log) => {
                    reasonCounts[log.reason] =
                        (reasonCounts[log.reason] || 0) +
                        log.quantity_defective;
                });
                const defectiveItemsByReasonData = Object.entries(reasonCounts)
                    .map(([reason, count]) => ({
                        reason,
                        count,
                    }))
                    .sort((a, b) => b.count - a.count);

                const statusCounts: { [key: string]: number } = {};
                defectiveLogsForCharts.forEach((log) => {
                    statusCounts[log.status] =
                        (statusCounts[log.status] || 0) +
                        log.quantity_defective;
                });
                const defectiveItemsByStatusData = Object.entries(statusCounts)
                    .map(([status, count]) => ({
                        status,
                        count,
                    }))
                    .sort((a, b) => b.count - a.count);

                setChartData({
                    itemsPerCategory: itemsPerCategoryData,
                    itemsPerLocation: itemsPerLocationData,
                    defectiveItemsByReason: defectiveItemsByReasonData,
                    defectiveItemsByStatus: defectiveItemsByStatusData,
                });
            } catch (err) {
                if (!mountedRef.current) return;
                let errorMessage = 'Gagal memuat data untuk diagram admin.';
                if (err instanceof Error) {
                    errorMessage = err.message;
                } else if (typeof err === 'string') {
                    errorMessage = err;
                }
                console.error(
                    'AdminChartsClient: Failed to load chart data:',
                    err,
                );
                setError(errorMessage);
                if (!isPolling) {
                    toast({
                        title: 'Kesalahan Memuat Diagram',
                        description: errorMessage,
                        variant: 'destructive',
                    });
                }
            } finally {
                if (mountedRef.current && !isPolling) setIsLoading(false);
            }
        },
        [toast],
    );

    useEffect(() => {
        loadChartData();
        const intervalId = setInterval(() => {
            if (mountedRef.current) {
                console.log('Polling admin chart data...');
                loadChartData(true);
            }
        }, POLLING_INTERVAL_ADMIN_CHARTS);
        return () => {
            clearInterval(intervalId);
        };
    }, [loadChartData]);

    if (isLoading && !chartData) {
        return (
            <div className="flex justify-center items-center py-10 col-span-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Memuat diagram...</span>
            </div>
        );
    }

    if (error && !chartData) {
        return (
            <div className="text-center py-10 text-destructive bg-destructive/10 rounded-lg shadow-sm my-8 p-4 col-span-full">
                <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-3" />
                <p className="text-lg font-semibold">
                    Gagal Memuat Diagram Statistik
                </p>
                <p className="text-sm mt-1">{error}</p>
                <Button
                    variant="outline"
                    onClick={() => loadChartData()}
                    className="mt-4 border-destructive text-destructive hover:bg-destructive/5"
                >
                    <RefreshCw className="mr-2 h-4 w-4" /> Coba Lagi
                </Button>
            </div>
        );
    }

    const noDetailedChartData =
        !chartData ||
        (chartData.itemsPerCategory.length === 0 &&
            chartData.itemsPerLocation.length === 0 &&
            chartData.defectiveItemsByReason.length === 0 &&
            chartData.defectiveItemsByStatus.length === 0);

    if (noDetailedChartData && !isLoading) {
        return (
            <div className="text-center py-10 text-muted-foreground bg-muted/30 rounded-lg shadow-sm my-8 col-span-full">
                <PackageSearch className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-xl font-semibold">
                    Belum ada data detail statistik.
                </p>
                <p className="text-sm mt-1">
                    Tambahkan item ke inventaris atau catat barang cacat untuk
                    melihat statistik detail.
                </p>
                <Button
                    variant="outline"
                    onClick={() => loadChartData()}
                    className="mt-6 border-primary text-primary hover:bg-primary/5"
                    disabled={isLoading}
                >
                    <RefreshCw
                        className={`mr-2 h-4 w-4 ${
                            isLoading ? 'animate-spin' : ''
                        }`}
                    />
                    Refresh
                </Button>
            </div>
        );
    }

    if (!chartData) return null;

    return (
        <>
            <h3 className="text-xl font-semibold tracking-tight text-foreground mb-6 mt-10 col-span-full">
                Statistik Detail Inventaris
            </h3>
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 mb-10 col-span-full">
                <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-base font-semibold text-foreground">
                            Item per Kategori
                        </CardTitle>
                        <BarChart4 className="h-5 w-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                        {chartData.itemsPerCategory &&
                        chartData.itemsPerCategory.length > 0 ? (
                            <ChartContainer
                                config={initialChartConfig}
                                className={cn('h-[350px] w-full')}
                            >
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsBarChart
                                        data={chartData.itemsPerCategory}
                                        layout="vertical"
                                        margin={{
                                            left: 20,
                                            right: 30,
                                            top: 5,
                                            bottom: 20,
                                        }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            horizontal={false}
                                        />
                                        <XAxis
                                            type="number"
                                            allowDecimals={false}
                                            stroke="hsl(var(--muted-foreground))"
                                            fontSize={13}
                                        />
                                        <YAxis
                                            dataKey="category"
                                            type="category"
                                            tickLine={false}
                                            axisLine={false}
                                            stroke="hsl(var(--muted-foreground))"
                                            fontSize={13}
                                            width={110}
                                            interval={0}
                                            tickFormatter={(value) =>
                                                value.length > 15
                                                    ? `${value.substring(
                                                          0,
                                                          12,
                                                      )}...`
                                                    : value
                                            }
                                        />
                                        <RechartsTooltip
                                            content={
                                                <CustomAdminInventoryTooltipContent
                                                    chartConfig={
                                                        initialChartConfig
                                                    }
                                                />
                                            }
                                            cursor={{
                                                fill: 'hsl(var(--muted))',
                                            }}
                                        />
                                        <ChartLegend
                                            content={<ChartLegendContent />}
                                        />
                                        <Bar
                                            dataKey="totalQuantity"
                                            fill="var(--color-totalQuantity)"
                                            radius={4}
                                            barSize={15}
                                            name={
                                                initialChartConfig.totalQuantity
                                                    .label as string
                                            }
                                        />
                                    </RechartsBarChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        ) : (
                            <div className="text-center py-10 text-muted-foreground h-[350px] flex items-center justify-center">
                                <p>Tidak ada data kategori.</p>
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground pt-2 text-center">
                            Distribusi jumlah jenis item unik dan total
                            kuantitas stok berdasarkan kategori.
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-base font-semibold text-foreground">
                            Item per Lokasi
                        </CardTitle>
                        <MapPin className="h-5 w-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                        {chartData.itemsPerLocation &&
                        chartData.itemsPerLocation.length > 0 ? (
                            <ChartContainer
                                config={initialChartConfig}
                                className={cn('h-[350px] w-full')}
                            >
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsBarChart
                                        data={chartData.itemsPerLocation}
                                        layout="vertical"
                                        margin={{
                                            left: 20,
                                            right: 30,
                                            top: 5,
                                            bottom: 20,
                                        }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            horizontal={false}
                                        />
                                        <XAxis
                                            type="number"
                                            allowDecimals={false}
                                            stroke="hsl(var(--muted-foreground))"
                                            fontSize={13}
                                        />
                                        <YAxis
                                            dataKey="location"
                                            type="category"
                                            tickLine={false}
                                            axisLine={false}
                                            stroke="hsl(var(--muted-foreground))"
                                            fontSize={13}
                                            width={110}
                                            interval={0}
                                            tickFormatter={(value) =>
                                                value.length > 15
                                                    ? `${value.substring(
                                                          0,
                                                          12,
                                                      )}...`
                                                    : value
                                            }
                                        />
                                        <RechartsTooltip
                                            content={
                                                <CustomAdminInventoryTooltipContent
                                                    chartConfig={
                                                        initialChartConfig
                                                    }
                                                />
                                            }
                                            cursor={{
                                                fill: 'hsl(var(--muted))',
                                            }}
                                        />
                                        <ChartLegend
                                            content={<ChartLegendContent />}
                                        />
                                        <Bar
                                            dataKey="totalQuantity"
                                            fill="var(--color-totalQuantity)"
                                            radius={4}
                                            barSize={15}
                                            name={
                                                initialChartConfig.totalQuantity
                                                    .label as string
                                            }
                                        />
                                    </RechartsBarChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        ) : (
                            <div className="text-center py-10 text-muted-foreground h-[350px] flex items-center justify-center">
                                <p>Tidak ada data lokasi.</p>
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground pt-2 text-center">
                            Distribusi jumlah jenis item unik dan total
                            kuantitas stok berdasarkan lokasi.
                        </p>
                    </CardContent>
                </Card>
            </div>

            <h3 className="text-xl font-semibold tracking-tight text-foreground mb-6 mt-10 col-span-full">
                Statistik Detail Barang Cacat
            </h3>
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 col-span-full">
                <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-base font-semibold text-foreground">
                            Unit Cacat per Alasan
                        </CardTitle>
                        <ListChecks className="h-5 w-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                        {chartData.defectiveItemsByReason &&
                        chartData.defectiveItemsByReason.length > 0 ? (
                            <ChartContainer
                                config={initialChartConfig}
                                className={cn('h-[350px] w-full')}
                            >
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsBarChart
                                        data={chartData.defectiveItemsByReason}
                                        layout="vertical"
                                        margin={{
                                            left: 30,
                                            right: 30,
                                            top: 5,
                                            bottom: 20,
                                        }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            horizontal={false}
                                        />
                                        <XAxis
                                            type="number"
                                            dataKey="count"
                                            allowDecimals={false}
                                            stroke="hsl(var(--muted-foreground))"
                                            fontSize={13}
                                        />
                                        <YAxis
                                            dataKey="reason"
                                            type="category"
                                            tickLine={false}
                                            axisLine={false}
                                            stroke="hsl(var(--muted-foreground))"
                                            fontSize={13}
                                            width={130}
                                            interval={0}
                                            tickFormatter={(value) =>
                                                value.length > 18
                                                    ? `${value.substring(
                                                          0,
                                                          15,
                                                      )}...`
                                                    : value
                                            }
                                        />
                                        <RechartsTooltip
                                            cursor={{
                                                fill: 'hsl(var(--muted))',
                                            }}
                                            content={
                                                <ChartTooltipContent indicator="dot" />
                                            }
                                        />
                                        <Bar
                                            dataKey="count"
                                            fill="hsl(var(--chart-3))"
                                            radius={4}
                                            barSize={
                                                chartData.defectiveItemsByReason
                                                    .length > 5
                                                    ? 15
                                                    : 20
                                            }
                                            name={
                                                initialChartConfig.count
                                                    .label as string
                                            }
                                        />
                                    </RechartsBarChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        ) : (
                            <div className="text-center py-10 text-muted-foreground h-[350px] flex items-center justify-center">
                                <p>
                                    Tidak ada data barang cacat berdasarkan
                                    alasan.
                                </p>
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground pt-2 text-center">
                            Distribusi unit barang cacat berdasarkan alasan yang
                            dicatat.
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-base font-semibold text-foreground">
                            Unit Cacat per Status
                        </CardTitle>
                        <BarChart4 className="h-5 w-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                        {chartData.defectiveItemsByStatus &&
                        chartData.defectiveItemsByStatus.length > 0 ? (
                            <ChartContainer
                                config={initialChartConfig}
                                className={cn('h-[350px] w-full')}
                            >
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsBarChart
                                        data={chartData.defectiveItemsByStatus}
                                        layout="vertical"
                                        margin={{
                                            left: 20,
                                            right: 30,
                                            top: 5,
                                            bottom: 20,
                                        }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            horizontal={false}
                                        />
                                        <XAxis
                                            type="number"
                                            dataKey="count"
                                            allowDecimals={false}
                                            stroke="hsl(var(--muted-foreground))"
                                            fontSize={13}
                                        />
                                        <YAxis
                                            dataKey="status"
                                            type="category"
                                            tickLine={false}
                                            axisLine={false}
                                            stroke="hsl(var(--muted-foreground))"
                                            fontSize={13}
                                            width={110}
                                            interval={0}
                                            tickFormatter={(value) =>
                                                value.length > 15
                                                    ? `${value.substring(
                                                          0,
                                                          12,
                                                      )}...`
                                                    : value
                                            }
                                        />
                                        <RechartsTooltip
                                            cursor={{
                                                fill: 'hsl(var(--muted))',
                                            }}
                                            content={
                                                <ChartTooltipContent indicator="dot" />
                                            }
                                        />
                                        <Bar
                                            dataKey="count"
                                            fill="hsl(var(--chart-4))"
                                            radius={4}
                                            barSize={
                                                chartData.defectiveItemsByStatus
                                                    .length > 5
                                                    ? 15
                                                    : 20
                                            }
                                            name={
                                                initialChartConfig.count
                                                    .label as string
                                            }
                                        />
                                    </RechartsBarChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        ) : (
                            <div className="text-center py-10 text-muted-foreground h-[350px] flex items-center justify-center">
                                <p>
                                    Tidak ada data barang cacat berdasarkan
                                    status.
                                </p>
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground pt-2 text-center">
                            Distribusi unit barang cacat berdasarkan status saat
                            ini.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
