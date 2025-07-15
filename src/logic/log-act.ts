'use server';

import { unstable_noStore as noStore } from 'next/cache';
import { query } from '@/lib/db';
import { getCurrentUserAction } from '@/logic/user';
import type { User, ActivityLog } from '@/lib/types';

// Fungsi mencatat aktivitas
export async function logActivity(
    performingUser: User | null,
    action: string,
    details?: string,
) {
    noStore();
    if (!performingUser) {
        console.warn(
            'Activity Log: Skipping log - no performing user identified.',
        );
        return;
    }

    try {
        await query(
            'INSERT INTO activity_log (user_id, username_at_log_time, action, details) VALUES ($1, $2, $3, $4)',
            [
                performingUser.id,
                performingUser.username,
                action,
                details || null,
            ],
        );
    } catch (err) {
        console.error('Activity Log: Failed to write:', err);
    }
}

// Ambil semua log (tanpa autentikasi)
export async function fetchActivityLogs(): Promise<ActivityLog[]> {
    noStore();

    const result = await query(
        'SELECT * FROM activity_log ORDER BY logged_at DESC',
    );

    return result.rows as ActivityLog[];
}

// Ambil log aktivitas untuk admin saja (versi aman)
export async function fetchActivityLogsAction(): Promise<ActivityLog[]> {
    noStore();

    const currentUser = await getCurrentUserAction();
    if (!currentUser) {
        console.warn('[ActivityLog] Access denied: no session');
        throw new Error('Anda belum login.');
    }

    if (currentUser.role !== 'admin') {
        console.warn(
            `[ActivityLog] Unauthorized access by user ${currentUser.username} (ID: ${currentUser.id})`,
        );
        throw new Error('Hanya admin yang dapat melihat log aktivitas.');
    }

    try {
        const result = await query<ActivityLog>(
            `SELECT id, user_id, username_at_log_time, action, details, logged_at 
             FROM activity_log 
             ORDER BY logged_at DESC`,
        );

        console.log(`[ActivityLog] ${result.rows.length} log entries fetched.`);
        return result.rows;
    } catch (error) {
        console.error('[ActivityLog] DB Error:', error);

        const dbError =
            error instanceof Error ? error.message : 'Unknown DB error';
        throw new Error(
            `Gagal mengambil log aktivitas. Periksa koneksi database atau skema tabel. Detail: ${dbError}`,
        );
    }
}
