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
            if (mountedRef.current) setLogs(fetchedLogs);
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : 'Tidak dapat mengambil log aktivitas.';
            if (mountedRef.current) {
                setError(message);
                toast({
                    title: 'Kesalahan Memuat Log',
                    description: message,
                    variant: 'destructive',
                });
                setLogs([]);
            }
        } finally {
            if (mountedRef.current) setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadLogs();
    }, [loadLogs]);

    const escapeCSVField = (field: any): string => {
        if (field === null || field === undefined) return '';
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
            'Waktu',
            'ID Pengguna',
            'Username',
            'Aksi',
            'Detail',
        ];
        const csvRows = [
            headers.join(','),
            ...logs.map((log) =>
                [
                    escapeCSVField(log.id),
                    escapeCSVField(
                        format(new Date(log.logged_at), 'dd MMM yy, HH:mm:ss', {
                            locale: IndonesianLocale,
                        }),
                    ),
                    escapeCSVField(log.user_id),
                    escapeCSVField(log.username_at_log_time),
                    escapeCSVField(log.action),
                    escapeCSVField(log.details),
                ].join(','),
            ),
        ];

        const blob = new Blob([csvRows.join('\n')], {
            type: 'text/csv;charset=utf-8;',
        });
        const filename = `activity_log_${
            new Date().toISOString().split('T')[0]
        }.csv`;
        const link = document.createElement('a');
        link.setAttribute('href', URL.createObjectURL(blob));
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
                            Pantau semua tindakan signifikan dalam sistem.
                        </CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <Button
                            onClick={loadLogs}
                            variant="outline"
                            disabled={isLoading}
                            className="w-full sm:w-auto"
                        >
                            <RefreshCw
                                className={`mr-2 h-4 w-4 ${
                                    isLoading ? 'animate-spin' : ''
                                }`}
                            />
                            Muat Ulang
                        </Button>
                        <Button
                            onClick={handleDownloadCSV}
                            variant="outline"
                            disabled={isLoading || logs.length === 0}
                            className="w-full sm:w-auto"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Download CSV
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="mt-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="ml-3 text-muted-foreground">
                                Memuat log...
                            </p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-10 text-destructive">
                            <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
                            <p className="font-semibold">Gagal Memuat Data</p>
                            <p className="text-sm">{error}</p>
                            <Button
                                variant="outline"
                                onClick={loadLogs}
                                className="mt-4"
                            >
                                <RefreshCw className="mr-2 h-4 w-4" /> Coba Lagi
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <ActivityLogTable logs={logs} />
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
