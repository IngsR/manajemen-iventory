'use client';

import type { ActivityLog } from '@/lib/types';
import { format } from 'date-fns';
import { id as IndonesianLocale } from 'date-fns/locale';

export function ActivityLogTable({ logs }: { logs: ActivityLog[] }) {
    return (
        <div className="max-h-[500px] overflow-y-auto border rounded-md">
            <table className="min-w-[900px] w-full text-sm text-left table-auto">
                <thead className="bg-gray-100 dark:bg-slate-800 sticky top-0 z-10">
                    <tr className="text-gray-700 dark:text-slate-200">
                        <th className="px-4 py-3 border-b">Waktu</th>
                        <th className="px-4 py-3 border-b">Pengguna</th>
                        <th className="px-4 py-3 border-b">Aksi</th>
                        <th className="px-4 py-3 border-b min-w-[400px]">
                            Detail
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {logs.map((log) => (
                        <tr
                            key={log.id}
                            className="hover:bg-gray-50 dark:hover:bg-slate-700"
                        >
                            <td className="px-4 py-2 border-b whitespace-nowrap">
                                {format(
                                    new Date(log.logged_at),
                                    'dd MMM yyyy, HH:mm:ss',
                                    {
                                        locale: IndonesianLocale,
                                    },
                                )}
                            </td>
                            <td className="px-4 py-2 border-b whitespace-nowrap">
                                {log.username_at_log_time}
                            </td>
                            <td className="px-4 py-2 border-b whitespace-nowrap">
                                {log.action}
                            </td>
                            <td className="px-4 py-2 border-b whitespace-pre-wrap">
                                {log.details}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
