'use server';

import { unstable_noStore as noStore, revalidatePath } from 'next/cache';
import { query } from '@/lib/db';
import { getCurrentUserAction } from '@/logic/user';
import { logActivity as _logActivity } from '@/logic/log-act';
import type {
    DefectiveItemLog,
    DefectiveItemLogEntry,
    LogDefectiveItemFormData,
    UpdateDefectiveItemStatusFormData,
} from '@/lib/types';

/** Ambil semua log barang cacat (JOIN dengan inventory_items) */
export async function fetchDefectiveItemsLogAction(): Promise<
    DefectiveItemLogEntry[]
> {
    noStore();
    try {
        const result = await query<DefectiveItemLogEntry>(`
            SELECT
                dil.id,
                dil.inventory_item_id,
                dil.item_name_at_log_time,
                dil.quantity_defective,
                dil.reason,
                dil.status,
                dil.notes,
                dil.logged_at,
                dil.updated_at,
                ii.name as inventory_item_name
            FROM defective_items_log dil
            LEFT JOIN inventory_items ii ON dil.inventory_item_id = ii.id
            ORDER BY dil.logged_at DESC
        `);
        return result.rows.map((row) => ({
            ...row,
            inventory_item_name:
                row.inventory_item_name || row.item_name_at_log_time,
        }));
    } catch (error) {
        console.error('Error fetching defective items log:', error);
        const dbError =
            error instanceof Error ? error.message : 'Unknown error';

        let hint = `Penyebab: ${dbError}`;
        if (dbError.includes('relation "defective_items_log"')) {
            hint =
                "Tabel 'defective_items_log' tidak ditemukan. Coba restart aplikasi.";
        } else if (dbError.includes('relation "inventory_items"')) {
            hint =
                "Tabel 'inventory_items' tidak ditemukan. Coba restart aplikasi.";
        }

        throw new Error(`Gagal mengambil log barang cacat. ${hint}`);
    }
}

/** Tambah log barang cacat */
export async function logDefectiveItemAction(
    data: LogDefectiveItemFormData,
): Promise<DefectiveItemLog | { error: string }> {
    noStore();
    const currentUser = await getCurrentUserAction();
    if (!currentUser)
        return { error: 'Otentikasi pengguna gagal untuk mencatat aktivitas.' };

    const newLogData = {
        inventory_item_id: data.inventory_item_id,
        item_name_at_log_time: data.item_name_at_log_time,
        quantity_defective: data.quantity_defective,
        reason: data.reason,
        status: data.status,
        notes: data.notes || null,
    };

    try {
        const result = await query<DefectiveItemLog>(
            `
            INSERT INTO defective_items_log 
            (inventory_item_id, item_name_at_log_time, quantity_defective, reason, status, notes)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `,
            [
                newLogData.inventory_item_id,
                newLogData.item_name_at_log_time,
                newLogData.quantity_defective,
                newLogData.reason,
                newLogData.status,
                newLogData.notes,
            ],
        );

        if (result.rows.length > 0) {
            const loggedDefect = result.rows[0];
            await _logActivity(
                currentUser,
                'Logged defective item',
                `Item: '${loggedDefect.item_name_at_log_time}' (Ref ID: ${loggedDefect.inventory_item_id}), Qty Defective: ${loggedDefect.quantity_defective}, Reason: '${loggedDefect.reason}', Log ID: ${loggedDefect.id}`,
            );
            revalidatePath('/statistics');
            revalidatePath('/admin/dashboard');
            revalidatePath('/defective-items');
            return loggedDefect;
        }

        return {
            error: 'Gagal mencatat barang cacat: Tidak ada baris yang dikembalikan.',
        };
    } catch (error: any) {
        console.error('Error logging defective item:', error);
        let msg = 'Gagal mencatat barang cacat karena kesalahan database.';
        if (error.code === '23502' && error.column === 'id') {
            msg =
                'Kolom ID tidak auto-increment. Periksa apakah kolom id diatur sebagai SERIAL PRIMARY KEY.';
        } else if (error instanceof Error) {
            msg = `Gagal mencatat: ${error.message}`;
        }
        return { error: msg };
    }
}

/** Update status log barang cacat */
export async function updateDefectiveItemStatusAction(
    logId: number,
    data: UpdateDefectiveItemStatusFormData,
): Promise<DefectiveItemLog | { error: string }> {
    noStore();
    const currentUser = await getCurrentUserAction();
    if (!currentUser)
        return { error: 'Otentikasi pengguna gagal untuk mencatat aktivitas.' };

    try {
        const currentLogResult = await query<DefectiveItemLog>(
            'SELECT item_name_at_log_time, status FROM defective_items_log WHERE id = $1',
            [logId],
        );
        if (currentLogResult.rows.length === 0) {
            return { error: 'Log barang cacat tidak ditemukan.' };
        }

        const currentLog = currentLogResult.rows[0];
        const result = await query<DefectiveItemLog>(
            `
            UPDATE defective_items_log 
            SET status = $1, notes = $2, updated_at = NOW() 
            WHERE id = $3 
            RETURNING *
        `,
            [data.status, data.notes || null, logId],
        );

        if (result.rows.length > 0) {
            const updatedLog = result.rows[0];
            await _logActivity(
                currentUser,
                'Updated defective item log status',
                `Log ID: ${updatedLog.id} for item '${updatedLog.item_name_at_log_time}', status updated from '${currentLog.status}' to '${updatedLog.status}'`,
            );
            revalidatePath('/statistics');
            revalidatePath('/admin/dashboard');
            revalidatePath('/defective-items');
            return updatedLog;
        }

        return {
            error: 'Gagal memperbarui status: Log tidak ditemukan atau tidak berubah.',
        };
    } catch (error) {
        console.error('Error updating defective item status:', error);
        let msg = 'Gagal memperbarui status log karena kesalahan database.';
        if (error instanceof Error)
            msg = `Gagal memperbarui status: ${error.message}`;
        return { error: msg };
    }
}

/** Hapus log barang cacat */
export async function deleteDefectiveItemLogAction(
    logId: number,
): Promise<{ success: boolean; error?: string }> {
    noStore();
    const currentUser = await getCurrentUserAction();
    if (!currentUser)
        return {
            success: false,
            error: 'Otentikasi pengguna gagal untuk mencatat aktivitas.',
        };

    let logDescription = `Log ID: ${logId}`;

    try {
        const logResult = await query<{
            item_name_at_log_time: string;
            quantity_defective: number;
        }>(
            'SELECT item_name_at_log_time, quantity_defective FROM defective_items_log WHERE id = $1',
            [logId],
        );

        if (logResult.rows.length > 0) {
            const log = logResult.rows[0];
            logDescription = `Defective log for item '${log.item_name_at_log_time}' (Qty: ${log.quantity_defective}, Log ID: ${logId})`;
        }
    } catch {}

    try {
        const result = await query(
            'DELETE FROM defective_items_log WHERE id = $1',
            [logId],
        );

        if (result.rowCount && result.rowCount > 0) {
            await _logActivity(
                currentUser,
                'Deleted defective item log',
                logDescription,
            );
            revalidatePath('/statistics');
            revalidatePath('/admin/dashboard');
            revalidatePath('/defective-items');
            return { success: true };
        }

        return {
            success: false,
            error: 'Log tidak ditemukan atau sudah dihapus.',
        };
    } catch (error) {
        console.error('Error deleting defective item log:', error);
        let msg = 'Gagal menghapus log barang cacat karena kesalahan database.';
        if (error instanceof Error)
            msg = `Gagal menghapus log: ${error.message}`;
        return { success: false, error: msg };
    }
}
