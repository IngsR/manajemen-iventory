// src/app/statistics/page.tsx
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import {
    BarChart4,
    LineChart,
    PieChart as PieChartIcon,
    PackageSearch,
    MapPin,
    DivideSquare,
    AlertTriangle,
    ListChecks,
    Loader2,
    RefreshCw,
} from 'lucide-react';
import {
    fetchInventoryItemsAction,
    fetchDefectiveItemsLogAction,
} from '@/app/actions';
import type { InventoryItem, DefectiveItemLogEntry } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

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

interface StatisticsData {
    totalUniqueItemTypes: number;
    itemsPerCategory: CategoryStatData[];
    itemsPerLocation: LocationStatData[];
    totalStockQuantity: number;
    averageQuantityPerItemType: number;
    totalDefectiveItems: number;
    defectiveItemsByReason: DefectiveReasonData[];
    defectiveItemsByStatus: DefectiveStatusData[];
}

const initialChartConfig = {
    uniqueItemCount: {
        label: 'Jenis Item',
        color: 'hsl(var(--chart-1))', // Will be used in custom tooltip
    },
    totalQuantity: {
        label: 'Total Kuantitas',
        color: 'hsl(var(--chart-2))', // Will be the bar color
    },
    count: {
        label: 'Jumlah Unit',
        color: 'hsl(var(--chart-1))',
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

// Custom Tooltip for Inventory Charts (Category & Location)
const CustomInventoryTooltipContent = ({
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

const POLLING_INTERVAL = 60000; // 60 seconds

export default function StatisticsPage() {
    const [statsData, setStatsData] = useState<StatisticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentYear, setCurrentYear] = useState<number | null>(null);
    const { toast } = useToast();
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        setCurrentYear(new Date().getFullYear());
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const loadStatistics = useCallback(
        async (isPolling = false) => {
            if (!isPolling) setIsLoading(true);
            setError(null);

            try {
                const [items, defectiveLogs]: [
                    InventoryItem[],
                    DefectiveItemLogEntry[],
                ] = await Promise.all([
                    fetchInventoryItemsAction(),
                    fetchDefectiveItemsLogAction(),
                ]);

                if (!mountedRef.current) return;

                const totalUniqueItemTypes = new Set(
                    items.map((item) => item.name),
                ).size;

                const categoryStats: {
                    [key: string]: {
                        uniqueItems: Set<number>;
                        totalQty: number;
                    };
                } = {};
                items.forEach((item) => {
                    if (!categoryStats[item.category]) {
                        categoryStats[item.category] = {
                            uniqueItems: new Set(),
                            totalQty: 0,
                        };
                    }
                    categoryStats[item.category].uniqueItems.add(item.id);
                    categoryStats[item.category].totalQty += item.quantity;
                });
                const itemsPerCategory = Object.entries(categoryStats)
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
                items.forEach((item) => {
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
                const itemsPerLocation = Object.entries(locationStats)
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

                const totalStockQuantity = items.reduce(
                    (sum, item) => sum + item.quantity,
                    0,
                );

                const averageQuantityPerItemType =
                    totalUniqueItemTypes > 0
                        ? parseFloat(
                              (
                                  totalStockQuantity / totalUniqueItemTypes
                              ).toFixed(2),
                          )
                        : 0;

                const totalDefectiveItems = defectiveLogs.reduce(
                    (sum, log) => sum + log.quantity_defective,
                    0,
                );

                const reasonCounts: { [key: string]: number } = {};
                defectiveLogs.forEach((log) => {
                    reasonCounts[log.reason] =
                        (reasonCounts[log.reason] || 0) +
                        log.quantity_defective;
                });
                const defectiveItemsByReason = Object.entries(reasonCounts)
                    .map(([reason, count]) => ({
                        reason,
                        count,
                    }))
                    .sort((a, b) => b.count - a.count);

                const statusCounts: { [key: string]: number } = {};
                defectiveLogs.forEach((log) => {
                    statusCounts[log.status] =
                        (statusCounts[log.status] || 0) +
                        log.quantity_defective;
                });
                const defectiveItemsByStatus = Object.entries(statusCounts)
                    .map(([status, count]) => ({
                        status,
                        count,
                    }))
                    .sort((a, b) => b.count - a.count);

                setStatsData({
                    totalUniqueItemTypes,
                    itemsPerCategory,
                    itemsPerLocation,
                    totalStockQuantity,
                    averageQuantityPerItemType,
                    totalDefectiveItems: totalDefectiveItems,
                    defectiveItemsByReason,
                    defectiveItemsByStatus,
                });
            } catch (err) {
                if (!mountedRef.current) return;
                let errorMessage = 'Gagal memuat data statistik.';
                if (err instanceof Error) {
                    errorMessage = err.message;
                } else if (typeof err === 'string') {
                    errorMessage = err;
                } else if (
                    err &&
                    typeof err === 'object' &&
                    'message' in err &&
                    typeof (err as any).message === 'string'
                ) {
                    errorMessage = (err as any).message;
                }
                console.error('Failed to load statistics data:', err);
                setError(errorMessage);
                if (!isPolling) {
                    toast({
                        title: 'Kesalahan Statistik',
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
        loadStatistics();
        const intervalId = setInterval(() => {
            if (mountedRef.current) {
                console.log('Polling statistics data...');
                loadStatistics(true);
            }
        }, POLLING_INTERVAL);

        return () => {
            clearInterval(intervalId);
        };
    }, [loadStatistics]);

    if (isLoading && !statsData) {
        return (
            <div className="flex-grow flex flex-col items-center justify-center">
                <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">
                    Memuat data statistik...
                </p>
            </div>
        );
    }

    if (error && !statsData) {
        return (
            <div className="flex-grow flex flex-col items-center justify-center">
                <div className="flex flex-col items-center justify-center py-10 text-destructive bg-destructive/10 p-6 rounded-md">
                    <AlertTriangle className="h-10 w-10 mb-3" />
                    <p className="text-xl font-semibold">
                        Gagal Memuat Data Statistik
                    </p>
                    <p className="text-base text-center mt-1 mb-4">{error}</p>
                    <Button
                        variant="outline"
                        onClick={() => loadStatistics()}
                        className="border-destructive text-destructive hover:bg-destructive/5"
                    >
                        <RefreshCw className="mr-2 h-4 w-4" /> Coba Lagi
                    </Button>
                </div>
            </div>
        );
    }

    if (
        !statsData ||
        (statsData.itemsPerCategory.length === 0 &&
            statsData.itemsPerLocation.length === 0 &&
            statsData.defectiveItemsByReason.length === 0 &&
            statsData.defectiveItemsByStatus.length === 0 &&
            statsData.totalUniqueItemTypes === 0)
    ) {
        return (
            <div className="flex-grow flex flex-col">
                <div className="container mx-auto px-4 py-8 flex-grow flex flex-col items-center justify-center">
                    <PackageSearch className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground text-xl">
                        Tidak ada data statistik untuk ditampilkan.
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                        Tambahkan item ke inventaris atau catat barang cacat
                        untuk melihat statistik.
                    </p>
                    <Button
                        variant="outline"
                        onClick={() => loadStatistics()}
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
                <footer className="bg-white text-black py-6 text-center text-sm w-full mt-auto border-t border-gray-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700">
                    © {currentYear || new Date().getFullYear()} Stockpile. Hak
                    cipta dilindungi.
                </footer>
            </div>
        );
    }

    return (
        <div className="flex-grow flex flex-col">
            <div className="container mx-auto px-4 py-8 flex-grow">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10">
                    <div className="mb-4 sm:mb-0 text-center sm:text-left">
                        <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl">
                            Laporan Statistik Inventaris
                        </h1>
                        <p className="mt-3 text-lg text-muted-foreground sm:text-xl">
                            Analisis mendalam mengenai data inventaris dan
                            barang cacat Anda.
                        </p>
                    </div>
                    <Button
                        onClick={() => loadStatistics()}
                        variant="outline"
                        disabled={isLoading}
                        className="border-primary text-primary hover:bg-primary/5 self-center sm:self-auto"
                    >
                        <RefreshCw
                            className={`mr-2 h-4 w-4 ${
                                isLoading ? 'animate-spin' : ''
                            }`}
                        />
                        Refresh
                    </Button>
                </div>

                <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-6 mt-8">
                    Ringkasan Umum
                </h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-base font-semibold text-foreground">
                                Total Jenis Item Unik
                            </CardTitle>
                            <PieChartIcon className="h-5 w-5 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-accent">
                                {statsData.totalUniqueItemTypes}
                            </div>
                            <p className="text-xs text-muted-foreground pt-1">
                                Jumlah jenis item unik (berdasarkan nama).
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-base font-semibold text-foreground">
                                Total Kuantitas Stok
                            </CardTitle>
                            <LineChart className="h-5 w-5 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-accent">
                                {statsData.totalStockQuantity}
                            </div>
                            <p className="text-xs text-muted-foreground pt-1">
                                Jumlah total unit dari semua item yang dapat
                                digunakan.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-base font-semibold text-foreground">
                                Rata-rata Kuantitas
                            </CardTitle>
                            <DivideSquare className="h-5 w-5 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-accent">
                                {statsData.averageQuantityPerItemType}
                            </div>
                            <p className="text-xs text-muted-foreground pt-1">
                                Rata-rata kuantitas per jenis item unik.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-base font-semibold text-foreground">
                                Total Unit Barang Cacat
                            </CardTitle>
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-destructive">
                                {statsData.totalDefectiveItems}
                            </div>
                            <p className="text-xs text-muted-foreground pt-1">
                                Jumlah unit barang cacat yang tercatat.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-6 mt-10 pt-4 border-t">
                    Distribusi Inventaris
                </h2>
                <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-base font-semibold text-foreground">
                                Item per Kategori
                            </CardTitle>
                            <BarChart4 className="h-5 w-5 text-primary" />
                        </CardHeader>
                        <CardContent>
                            {statsData.itemsPerCategory &&
                            statsData.itemsPerCategory.length > 0 ? (
                                <ChartContainer
                                    config={initialChartConfig}
                                    className="h-[300px] w-full"
                                >
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <RechartsBarChart
                                            data={statsData.itemsPerCategory}
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
                                                    <CustomInventoryTooltipContent
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
                                                    initialChartConfig
                                                        .totalQuantity
                                                        .label as string
                                                }
                                            />
                                        </RechartsBarChart>
                                    </ResponsiveContainer>
                                </ChartContainer>
                            ) : (
                                <div className="text-center py-10 text-muted-foreground h-[300px] flex items-center justify-center">
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
                            {statsData.itemsPerLocation &&
                            statsData.itemsPerLocation.length > 0 ? (
                                <ChartContainer
                                    config={initialChartConfig}
                                    className="h-[300px] w-full"
                                >
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <RechartsBarChart
                                            data={statsData.itemsPerLocation}
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
                                                    <CustomInventoryTooltipContent
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
                                                    initialChartConfig
                                                        .totalQuantity
                                                        .label as string
                                                }
                                            />
                                        </RechartsBarChart>
                                    </ResponsiveContainer>
                                </ChartContainer>
                            ) : (
                                <div className="text-center py-10 text-muted-foreground h-[300px] flex items-center justify-center">
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

                <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-6 mt-10 pt-4 border-t">
                    Analisis Barang Cacat
                </h2>
                <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-base font-semibold text-foreground">
                                Unit Cacat per Alasan
                            </CardTitle>
                            <ListChecks className="h-5 w-5 text-primary" />
                        </CardHeader>
                        <CardContent>
                            {statsData.defectiveItemsByReason &&
                            statsData.defectiveItemsByReason.length > 0 ? (
                                <ChartContainer
                                    config={initialChartConfig}
                                    className="h-[300px] w-full"
                                >
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <RechartsBarChart
                                            data={
                                                statsData.defectiveItemsByReason
                                            }
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
                                                    statsData
                                                        .defectiveItemsByReason
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
                                <div className="text-center py-10 text-muted-foreground h-[300px] flex items-center justify-center">
                                    <p>
                                        Tidak ada data barang cacat berdasarkan
                                        alasan.
                                    </p>
                                </div>
                            )}
                            <p className="text-xs text-muted-foreground pt-2 text-center">
                                Distribusi unit barang cacat berdasarkan alasan
                                yang dicatat.
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
                            {statsData.defectiveItemsByStatus &&
                            statsData.defectiveItemsByStatus.length > 0 ? (
                                <ChartContainer
                                    config={initialChartConfig}
                                    className="h-[300px] w-full"
                                >
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <RechartsBarChart
                                            data={
                                                statsData.defectiveItemsByStatus
                                            }
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
                                                    statsData
                                                        .defectiveItemsByStatus
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
                                <div className="text-center py-10 text-muted-foreground h-[300px] flex items-center justify-center">
                                    <p>
                                        Tidak ada data barang cacat berdasarkan
                                        status.
                                    </p>
                                </div>
                            )}
                            <p className="text-xs text-muted-foreground pt-2 text-center">
                                Distribusi unit barang cacat berdasarkan status
                                saat ini.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
            <footer className="bg-white text-black py-6 text-center text-sm w-full border-t border-gray-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700">
                © {currentYear || new Date().getFullYear()} IngsR - Ikhwan
                Ramadhan MIT LICENSE.
            </footer>
        </div>
    );
}
