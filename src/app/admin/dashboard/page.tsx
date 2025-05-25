import {
    getCurrentUserAction,
    fetchInventoryItemsAction,
    fetchDefectiveItemsLogAction,
    fetchUsersAction,
} from '@/app/actions';
import { redirect } from 'next/navigation';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
    Users,
    Activity,
    ShieldCheck,
    Package,
    Warehouse,
    AlertTriangle as AlertTriangleIcon,
    UserCheck,
    Loader2,
} from 'lucide-react'; // Renamed AlertTriangle to avoid conflict
import type { InventoryItem, DefectiveItemLogEntry, User } from '@/lib/types';
import dynamic from 'next/dynamic';
import { InteractiveSummaryCard } from '@/components/admin/InteractiveSummaryCard'; // New import

const AdminChartsClient = dynamic(() => import('./AdminChartsClient'), {
    loading: () => (
        <div className="flex justify-center items-center py-10 col-span-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />{' '}
            <span className="ml-2">Memuat diagram...</span>
        </div>
    ),
});

export default async function AdminDashboardPage() {
    const user = await getCurrentUserAction();

    if (!user || user.role !== 'admin') {
        redirect('/login');
    }

    let inventoryItemsResult: InventoryItem[] = [];
    let defectiveLogsResult: DefectiveItemLogEntry[] = [];
    let usersResult: User[] = [];

    let summaryTotalUniqueItemTypes = 0;
    let summaryTotalStockQuantity = 0;
    let summaryTotalDefectiveUnits = 0;
    let summaryTotalActiveUsers = 0;

    let fetchSummaryError = null;

    try {
        [inventoryItemsResult, defectiveLogsResult, usersResult] =
            await Promise.all([
                fetchInventoryItemsAction(),
                fetchDefectiveItemsLogAction(),
                fetchUsersAction(),
            ]);

        summaryTotalUniqueItemTypes = new Set(
            inventoryItemsResult.map((item) => item.name),
        ).size;
        summaryTotalStockQuantity = inventoryItemsResult.reduce(
            (sum, item) => sum + item.quantity,
            0,
        );
        summaryTotalDefectiveUnits = defectiveLogsResult.reduce(
            (sum, log) => sum + log.quantity_defective,
            0,
        );
        summaryTotalActiveUsers = usersResult.filter(
            (u) => u.status === 'active',
        ).length;
    } catch (error) {
        console.error(
            'Error fetching data for admin dashboard summary:',
            error,
        );
        fetchSummaryError =
            error instanceof Error
                ? error.message
                : 'Gagal memuat data ringkasan dasbor.';
        // Set default values for data arrays on error to prevent issues with InteractiveSummaryCard
        inventoryItemsResult = [];
        defectiveLogsResult = [];
        usersResult = [];
    }

    const activeUsersData = usersResult.filter((u) => u.status === 'active');

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <div className="flex items-center justify-center sm:justify-start mb-4">
                    <ShieldCheck className="h-12 w-12 text-primary mr-3" />
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-primary">
                            Dasbor Admin
                        </h1>
                        <p className="mt-1 text-lg sm:text-xl text-muted-foreground">
                            Selamat datang,{' '}
                            <span className="font-semibold text-foreground">
                                {user.username}
                            </span>
                            ! Kelola sistem dari sini.
                        </p>
                    </div>
                </div>
            </div>

            <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-6 mt-8">
                Fitur Manajemen
            </h2>
            <div className="grid gap-6 md:grid-cols-2 mb-10">
                <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg border-t-4 border-primary">
                    <CardHeader>
                        <CardTitle className="flex items-center text-2xl text-primary">
                            <Users className="mr-3 h-7 w-7" />
                            Manajemen Pengguna
                        </CardTitle>
                        <CardDescription className="text-base text-muted-foreground mt-1">
                            Buat, lihat, dan kelola akun karyawan.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/admin/user-management">
                            <Button
                                variant="outline"
                                className="w-full border-primary text-primary hover:bg-primary/5 hover:text-primary"
                            >
                                Kelola Pengguna
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg border-t-4 border-primary">
                    <CardHeader>
                        <CardTitle className="flex items-center text-2xl text-primary">
                            <Activity className="mr-3 h-7 w-7" />
                            Log Aktivitas Karyawan
                        </CardTitle>
                        <CardDescription className="text-base text-muted-foreground mt-1">
                            Pantau semua tindakan yang dilakukan oleh karyawan.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/admin/activity-log">
                            <Button
                                variant="outline"
                                className="w-full border-primary text-primary hover:bg-primary/5 hover:text-primary"
                            >
                                Lihat Log Aktivitas
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-primary mb-8 mt-12 pt-6 border-t">
                Laporan & Statistik Sistem
            </h2>

            <div className="mb-10">
                <h3 className="text-xl font-semibold tracking-tight text-foreground mb-4">
                    Ringkasan Sistem
                </h3>
                {fetchSummaryError ? (
                    <div className="text-center py-10 text-destructive bg-destructive/10 rounded-lg shadow-sm my-8 p-4">
                        <AlertTriangleIcon className="h-12 w-12 text-destructive mx-auto mb-3" />
                        <p className="text-lg font-semibold">
                            Gagal Memuat Data Ringkasan
                        </p>
                        <p className="text-sm mt-1">{fetchSummaryError}</p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <InteractiveSummaryCard
                            title="Total Jenis Item"
                            value={summaryTotalUniqueItemTypes}
                            description="Jenis item unik dalam inventaris."
                            icon={<Package className="h-5 w-5 text-primary" />}
                            data={inventoryItemsResult}
                            previewType="uniqueItemNames"
                        />
                        <InteractiveSummaryCard
                            title="Total Kuantitas Stok"
                            value={summaryTotalStockQuantity}
                            description="Total unit semua item yang tersedia."
                            icon={
                                <Warehouse className="h-5 w-5 text-primary" />
                            }
                            data={inventoryItemsResult}
                            previewType="itemsWithQuantity"
                        />
                        <InteractiveSummaryCard
                            title="Total Unit Cacat"
                            value={summaryTotalDefectiveUnits}
                            description="Unit barang cacat tercatat."
                            icon={
                                <AlertTriangleIcon className="h-5 w-5 text-destructive" />
                            }
                            data={defectiveLogsResult}
                            previewType="defectiveItemNames"
                        />
                        <InteractiveSummaryCard
                            title="Pengguna Aktif"
                            value={summaryTotalActiveUsers}
                            description="Total pengguna dengan status aktif."
                            icon={
                                <UserCheck className="h-5 w-5 text-primary" />
                            }
                            data={activeUsersData}
                            previewType="userNames"
                        />
                    </div>
                )}
            </div>

            <AdminChartsClient />
        </div>
    );
}
