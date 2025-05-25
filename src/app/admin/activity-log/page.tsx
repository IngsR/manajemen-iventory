'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import { ActivityLogTable } from '@/components/admin/ActivityLogTable';
import type { ActivityLog } from '@/lib/types';
import { fetchActivityLogsAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import {
    Activity,
    Loader2,
    AlertTriangle,
    RefreshCw,
    Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { id as IndonesianLocale } from 'date-fns/locale';

export default function ActivityLogPage() {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const loadLogs = useCallback(async () => {
        if (!mountedRef.current) return;
        setIsLoading(true);
        setError(null);
        try {
            const fetchedLogs = await fetchActivityLogsAction();
            if (mountedRef.current) {
                setLogs(fetchedLogs);
            }
        } catch (err) {
            console.error('Error loading activity logs:', err);
            let errorMessage = 'Tidak dapat mengambil log aktivitas.';
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

            if (mountedRef.current) {
                setError(errorMessage);
                toast({
                    title: 'Kesalahan Memuat Log',
                    description: errorMessage,
                    variant: 'destructive',
                });
                setLogs([]);
            }
        } finally {
            if (mountedRef.current) {
                setIsLoading(false);
            }
        }
    }, [toast]);

    useEffect(() => {
        loadLogs();
    }, [loadLogs]);

    const escapeCSVField = (field: any): string => {
        if (field === null || field === undefined) {
            return '';
        }
        let str = String(field);
        if (str.includes(',') || str.includes('\n') || str.includes('"')) {
            str = `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    const handleDownloadCSV = () => {
        if (logs.length === 0) {
            toast({
                title: 'Tidak Ada Data',
                description: 'Tidak ada log aktivitas untuk diunduh.',
                variant: 'default',
            });
            return;
        }

        const headers = [
            'ID Log',
            'Waktu (Lokal)',
            'ID Pengguna',
            'Username (Saat Log)',
            'Aksi',
            'Detail',
        ];

        const csvRows = [
            headers.join(','),
            ...logs.map((log) =>
                [
                    escapeCSVField(log.id),
                    escapeCSVField(
                        format(new Date(log.logged_at), 'yyyy-MM-dd HH:mm:ss', {
                            locale: IndonesianLocale,
                        }),
                    ),
                    escapeCSVField(log.user_id === null ? '' : log.user_id),
                    escapeCSVField(log.username_at_log_time),
                    escapeCSVField(log.action),
                    escapeCSVField(log.details),
                ].join(','),
            ),
        ];

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });

        const date = new Date();
        const formattedDate = `${date.getFullYear()}-${String(
            date.getMonth() + 1,
        ).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const filename = `activity_log_${formattedDate}.csv`;

        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } else {
            toast({
                title: 'Error',
                description:
                    'Browser Anda tidak mendukung unduhan otomatis. Silakan coba browser lain.',
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <Card className="shadow-lg rounded-lg">
                <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <CardTitle className="flex items-center text-3xl font-semibold text-primary">
                            <Activity className="mr-4 h-8 w-8" />
                            Log Aktivitas Karyawan
                        </CardTitle>
                        <CardDescription className="mt-1 text-muted-foreground">
                            Pantau semua tindakan signifikan yang dilakukan oleh
                            pengguna dalam sistem.
                        </CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                            onClick={loadLogs}
                            variant="outline"
                            disabled={isLoading}
                            className="border-primary text-primary hover:bg-primary/5"
                        >
                            <RefreshCw
                                className={`mr-2 h-4 w-4 ${
                                    isLoading ? 'animate-spin' : ''
                                }`}
                            />
                            Muat Ulang Log
                        </Button>
                        <Button
                            onClick={handleDownloadCSV}
                            variant="outline" // Changed to outline to match refresh button
                            disabled={isLoading || logs.length === 0}
                            className="border-primary text-primary hover:bg-primary/5" // Changed from accent to primary color scheme
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Download CSV
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="mt-6">
                    {isLoading && (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="ml-3 text-muted-foreground">
                                Memuat log aktivitas...
                            </p>
                        </div>
                    )}
                    {!isLoading && error && (
                        <div className="flex flex-col items-center justify-center py-10 text-destructive bg-destructive/10 p-4 rounded-md">
                            <AlertTriangle className="h-8 w-8 mb-2" />
                            <p className="font-semibold">
                                Gagal Memuat Data Log
                            </p>
                            <p className="text-sm">{error}</p>
                            <Button
                                variant="outline"
                                onClick={loadLogs}
                                className="mt-4"
                            >
                                <RefreshCw className="mr-2 h-4 w-4" /> Coba Lagi
                            </Button>
                        </div>
                    )}
                    {!isLoading && !error && <ActivityLogTable logs={logs} />}
                </CardContent>
            </Card>
        </div>
    );
}
