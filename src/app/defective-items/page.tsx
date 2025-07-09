'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { LogDefectiveItemDialog } from '@/components/inventory/LogDefectiveItemDialog';
import { DefectiveItemsTable } from '@/components/inventory/DefectiveItemsTable';
import type {
    InventoryItem,
    DefectiveItemLogEntry,
    LogDefectiveItemFormData,
    UpdateDefectiveItemStatusFormData,
    DefectiveItemLog,
} from '@/lib/types';
import {
    PlusCircle,
    PackageSearch,
    AlertTriangle,
    Trash2,
    Edit3,
    RefreshCw,
    Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
    fetchInventoryItemsAction,
    fetchDefectiveItemsLogAction,
    logDefectiveItemAction,
    deleteDefectiveItemLogAction,
    updateDefectiveItemStatusAction,
} from '../actions';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { UpdateDefectiveStatusDialog } from '@/components/inventory/UpdateDefectiveStatusDialog';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

export default function DefectiveItemsPage() {
    const [defectiveLogs, setDefectiveLogs] = useState<DefectiveItemLogEntry[]>(
        [],
    );
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pageError, setPageError] = useState<string | null>(null);
    const [logToDelete, setLogToDelete] =
        useState<DefectiveItemLogEntry | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [logToUpdateStatus, setLogToUpdateStatus] =
        useState<DefectiveItemLogEntry | null>(null);
    const [isUpdateStatusDialogOpen, setIsUpdateStatusDialogOpen] =
        useState(false);
    const [currentYear, setCurrentYear] = useState<number | null>(null);

    useEffect(() => {
        setCurrentYear(new Date().getFullYear());
    }, []);

    const { toast } = useToast();

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setPageError(null);
        try {
            const [logs, items] = await Promise.all([
                fetchDefectiveItemsLogAction(),
                fetchInventoryItemsAction(),
            ]);
            setDefectiveLogs(logs);
            setInventoryItems(items);
        } catch (error) {
            let errorMessage = 'Tidak dapat mengambil data dari database.';
            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            } else if (
                error &&
                typeof error === 'object' &&
                'message' in error &&
                typeof (error as any).message === 'string'
            ) {
                errorMessage = (error as any).message;
            }
            console.error('Error loading defective items page data:', error);
            setPageError(errorMessage);
            toast({
                title: 'Kesalahan Memuat Data',
                description: errorMessage,
                variant: 'destructive',
            });
            setDefectiveLogs([]);
            setInventoryItems([]);
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleLogDefectiveItem = async (
        data: LogDefectiveItemFormData,
    ): Promise<{
        success: boolean;
        error?: string;
        data?: DefectiveItemLog;
    }> => {
        const result = await logDefectiveItemAction(data);
        if ('error' in result) {
            toast({
                title: 'Gagal Mencatat Barang Cacat',
                description: result.error,
                variant: 'destructive',
            });
            return { success: false, error: result.error };
        }
        await loadData();
        toast({
            title: 'Barang Cacat Dicatat',
            description: `Item "${result.item_name_at_log_time}" (${result.quantity_defective} unit) berhasil dicatat.`,
        });
        return { success: true, data: result };
    };

    const handleOpenDeleteDialog = (log: DefectiveItemLogEntry) => {
        setLogToDelete(log);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteLog = async () => {
        if (!logToDelete) return;
        const result = await deleteDefectiveItemLogAction(logToDelete.id);
        if (result.success) {
            await loadData();
            toast({
                title: 'Log Dihapus',
                description: `Log untuk "${logToDelete.item_name_at_log_time}" berhasil dihapus.`,
            });
        } else {
            toast({
                title: 'Kesalahan Menghapus Log',
                description: result.error || 'Tidak dapat menghapus log.',
                variant: 'destructive',
            });
        }
        setIsDeleteDialogOpen(false);
        setLogToDelete(null);
    };

    const handleOpenUpdateStatusDialog = (log: DefectiveItemLogEntry) => {
        setLogToUpdateStatus(log);
        setIsUpdateStatusDialogOpen(true);
    };

    const handleUpdateStatus = async (
        logId: number,
        data: UpdateDefectiveItemStatusFormData,
    ) => {
        const originalLog = defectiveLogs.find((log) => log.id === logId);
        if (!originalLog) return;

        const result = await updateDefectiveItemStatusAction(logId, data);
        if ('error' in result) {
            toast({
                title: 'Kesalahan Memperbarui Status',
                description: result.error,
                variant: 'destructive',
            });
        } else {
            await loadData();
            toast({
                title: 'Status Diperbarui',
                description: `Status log untuk "${result.item_name_at_log_time}" diperbarui menjadi "${result.status}".`,
            });
        }
        setIsUpdateStatusDialogOpen(false);
    };

    return (
        <div className="flex-grow flex flex-col">
            <div className="container mx-auto px-4 py-8 flex-grow flex flex-col">
                <Card className="shadow-lg rounded-lg flex-grow flex flex-col">
                    <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle className="flex items-center text-3xl font-semibold text-destructive">
                                <AlertTriangle className="mr-4 h-8 w-8" />
                                Log Barang Cacat Produksi
                            </CardTitle>
                            <CardDescription className="mt-1 text-muted-foreground">
                                Catat dan kelola item yang ditemukan cacat atau
                                rusak.
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={loadData}
                                variant="outline"
                                disabled={isLoading}
                                className="border-primary text-primary hover:bg-primary/5"
                            >
                                <RefreshCw
                                    className={`mr-2 h-4 w-4 ${
                                        isLoading ? 'animate-spin' : ''
                                    }`}
                                />
                                Muat Ulang
                            </Button>
                            <LogDefectiveItemDialog
                                inventoryItems={inventoryItems}
                                onLogDefectiveItem={handleLogDefectiveItem}
                            >
                                <Button
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md transition-all duration-150 ease-in-out hover:shadow-lg transform hover:-translate-y-0.5"
                                    disabled={
                                        inventoryItems.length === 0 &&
                                        !isLoading
                                    }
                                >
                                    <PlusCircle className="mr-2 h-5 w-5" />{' '}
                                    Catat Barang Cacat
                                </Button>
                            </LogDefectiveItemDialog>
                        </div>
                    </CardHeader>
                    <CardContent className="mt-6 flex-grow flex flex-col">
                        {isLoading && (
                            <div className="flex-grow flex items-center justify-center py-10">
                                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                <p className="ml-4 text-lg text-muted-foreground">
                                    Memuat data barang cacat...
                                </p>
                            </div>
                        )}
                        {!isLoading && pageError && (
                            <div className="flex-grow flex flex-col items-center justify-center py-10 text-destructive bg-destructive/10 p-6 rounded-md">
                                <AlertTriangle className="h-10 w-10 mb-3" />
                                <p className="text-xl font-semibold">
                                    Gagal Memuat Data
                                </p>
                                <p className="text-base text-center mt-1 mb-4">
                                    {pageError}
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={loadData}
                                    className="border-destructive text-destructive hover:bg-destructive/5"
                                >
                                    <RefreshCw className="mr-2 h-4 w-4" /> Coba
                                    Lagi
                                </Button>
                            </div>
                        )}
                        {!isLoading &&
                            !pageError &&
                            (defectiveLogs.length > 0 ||
                            inventoryItems.length > 0 ? (
                                <DefectiveItemsTable
                                    items={defectiveLogs}
                                    onUpdateStatus={
                                        handleOpenUpdateStatusDialog
                                    }
                                    onDeleteLog={handleOpenDeleteDialog}
                                />
                            ) : (
                                <div className="flex-grow flex flex-col items-center justify-center py-10 text-muted-foreground">
                                    <PackageSearch className="h-12 w-12 mb-4" />
                                    <p className="text-xl">
                                        Tidak ada data barang cacat.
                                    </p>
                                    <p className="text-base mt-1">
                                        {inventoryItems.length === 0
                                            ? 'Tambahkan item ke inventaris terlebih dahulu untuk dapat mencatat barang cacat.'
                                            : 'Catat barang cacat baru untuk memulai.'}
                                    </p>
                                </div>
                            ))}
                    </CardContent>
                </Card>

                {logToDelete && (
                    <AlertDialog
                        open={isDeleteDialogOpen}
                        onOpenChange={setIsDeleteDialogOpen}
                    >
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    Hapus Log Barang Cacat?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    Anda akan menghapus log untuk item "
                                    {logToDelete.item_name_at_log_time}"
                                    (jumlah: {logToDelete.quantity_defective})
                                    yang dicatat pada{' '}
                                    {new Date(
                                        logToDelete.logged_at,
                                    ).toLocaleDateString()}
                                    . Tindakan ini tidak dapat dibatalkan.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel
                                    onClick={() => setIsDeleteDialogOpen(false)}
                                >
                                    Batal
                                </AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleDeleteLog}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" /> Hapus
                                    Log
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}

                {logToUpdateStatus && (
                    <UpdateDefectiveStatusDialog
                        logEntry={logToUpdateStatus}
                        open={isUpdateStatusDialogOpen}
                        onOpenChange={setIsUpdateStatusDialogOpen}
                        onUpdateStatus={handleUpdateStatus}
                    />
                )}
            </div>
            <footer className="bg-white text-black py-6 text-center text-sm w-full border-t border-gray-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700">
                © {currentYear || ''} IngsR. Ikhwan Ramadhan MIT LICENSE.
            </footer>
        </div>
    );
}
