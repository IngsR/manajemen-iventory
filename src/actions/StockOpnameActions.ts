'use server';

import { revalidatePath } from 'next/cache';
import { requirePermission, isAuthError } from '@/lib/Auth';
import { isInventoryError } from '@/services/inventory/InventoryErrors';
import {
    createStockOpname,
    addOrUpdateStockOpnameItem,
    removeStockOpnameItem,
    submitStockOpname,
    approveStockOpname,
    rejectStockOpname,
    getStockOpnames,
    getStockOpnameDetail,
    PopulatedOpnameDetail,
} from '@/services/inventory/StockOpnameService';
import { StockOpnameDoc, StockOpnameStatus } from '@/models/StockOpnameModel';

export interface OpnameActionResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    code?: string;
}

export async function createStockOpnameAction(
    formData: FormData
): Promise<OpnameActionResponse<{ stockOpnameId: string; opnameNumber: string }>> {
    try {
        const user = await requirePermission('STOCK_OPNAME_CREATE');

        const warehouseId = formData.get('warehouseId') as string;
        const notes = (formData.get('notes') as string) || undefined;

        if (!warehouseId) {
            return { success: false, error: 'Gudang wajib dipilih.', code: 'INVALID_INPUT' };
        }

        const result = await createStockOpname({
            warehouseId,
            notes,
            actor: {
                userId: user._id.toHexString(),
                name: user.name,
                role: user.role,
            },
        });

        try { revalidatePath('/inventory/stock-opname'); } catch {}
        return { success: true, data: result };
    } catch (err) {
        if (isAuthError(err)) return { success: false, error: err.message, code: err.code };
        if (isInventoryError(err)) return { success: false, error: err.message, code: err.code };
        console.error('[createStockOpnameAction]', err);
        return { success: false, error: 'Gagal membuat dokumen stock opname.', code: 'ERROR' };
    }
}

export async function addStockOpnameItemAction(
    formData: FormData
): Promise<OpnameActionResponse> {
    try {
        const user = await requirePermission('STOCK_OPNAME_CREATE');

        const stockOpnameId = formData.get('stockOpnameId') as string;
        const itemId = formData.get('itemId') as string;
        const locationId = formData.get('locationId') as string;
        const countedQuantity = parseInt(formData.get('countedQuantity') as string, 10);

        if (!stockOpnameId || !itemId || !locationId || isNaN(countedQuantity)) {
            return {
                success: false,
                error: 'Barang, lokasi, dan jumlah hitung fisik (angka >= 0) wajib diisi.',
                code: 'INVALID_INPUT',
            };
        }

        await addOrUpdateStockOpnameItem({
            stockOpnameId,
            itemId,
            locationId,
            countedQuantity,
            actor: {
                userId: user._id.toHexString(),
                name: user.name,
                role: user.role,
            },
        });

        try { revalidatePath(`/inventory/stock-opname/${stockOpnameId}`); } catch {}
        return { success: true };
    } catch (err) {
        if (isAuthError(err)) return { success: false, error: err.message, code: err.code };
        if (isInventoryError(err)) return { success: false, error: err.message, code: err.code };
        console.error('[addStockOpnameItemAction]', err);
        return { success: false, error: 'Gagal menambahkan detail item opname.', code: 'ERROR' };
    }
}

export async function removeStockOpnameItemAction(
    stockOpnameId: string,
    stockOpnameItemId: string
): Promise<OpnameActionResponse> {
    try {
        await requirePermission('STOCK_OPNAME_CREATE');

        await removeStockOpnameItem(stockOpnameId, stockOpnameItemId);

        try { revalidatePath(`/inventory/stock-opname/${stockOpnameId}`); } catch {}
        return { success: true };
    } catch (err) {
        if (isAuthError(err)) return { success: false, error: err.message, code: err.code };
        if (isInventoryError(err)) return { success: false, error: err.message, code: err.code };
        return { success: false, error: 'Gagal menghapus detail item.', code: 'ERROR' };
    }
}

export async function submitStockOpnameAction(
    stockOpnameId: string
): Promise<OpnameActionResponse<{ opnameNumber: string }>> {
    try {
        const user = await requirePermission('STOCK_OPNAME_SUBMIT');

        const result = await submitStockOpname(stockOpnameId, {
            userId: user._id.toHexString(),
            name: user.name,
            role: user.role,
        });

        try {
            revalidatePath('/inventory/stock-opname');
            revalidatePath(`/inventory/stock-opname/${stockOpnameId}`);
        } catch {}

        return { success: true, data: result };
    } catch (err) {
        if (isAuthError(err)) return { success: false, error: err.message, code: err.code };
        if (isInventoryError(err)) return { success: false, error: err.message, code: err.code };
        console.error('[submitStockOpnameAction]', err);
        return { success: false, error: 'Gagal mengajukan stock opname.', code: 'ERROR' };
    }
}

export async function approveStockOpnameAction(
    stockOpnameId: string
): Promise<OpnameActionResponse<{ opnameNumber: string; adjustmentsCount: number }>> {
    try {
        const user = await requirePermission('STOCK_OPNAME_APPROVE');

        const result = await approveStockOpname(stockOpnameId, {
            userId: user._id.toHexString(),
            name: user.name,
            role: user.role,
        });

        try {
            revalidatePath('/inventory/stock-opname');
            revalidatePath(`/inventory/stock-opname/${stockOpnameId}`);
            revalidatePath('/audit');
        } catch {}

        return { success: true, data: result };
    } catch (err) {
        if (isAuthError(err)) return { success: false, error: err.message, code: err.code };
        if (isInventoryError(err)) return { success: false, error: err.message, code: err.code };
        console.error('[approveStockOpnameAction]', err);
        return { success: false, error: 'Gagal menyetujui stock opname.', code: 'ERROR' };
    }
}

export async function rejectStockOpnameAction(
    formData: FormData
): Promise<OpnameActionResponse<{ opnameNumber: string }>> {
    try {
        const user = await requirePermission('STOCK_OPNAME_REJECT');

        const stockOpnameId = formData.get('stockOpnameId') as string;
        const rejectionReason = formData.get('rejectionReason') as string;

        if (!stockOpnameId || !rejectionReason || rejectionReason.trim().length === 0) {
            return {
                success: false,
                error: 'ID Opname dan alasan penolakan wajib diisi.',
                code: 'INVALID_INPUT',
            };
        }

        const result = await rejectStockOpname(
            stockOpnameId,
            rejectionReason,
            {
                userId: user._id.toHexString(),
                name: user.name,
                role: user.role,
            }
        );

        try {
            revalidatePath('/inventory/stock-opname');
            revalidatePath(`/inventory/stock-opname/${stockOpnameId}`);
            revalidatePath('/audit');
        } catch {}

        return { success: true, data: result };
    } catch (err) {
        if (isAuthError(err)) return { success: false, error: err.message, code: err.code };
        if (isInventoryError(err)) return { success: false, error: err.message, code: err.code };
        console.error('[rejectStockOpnameAction]', err);
        return { success: false, error: 'Gagal menolak stock opname.', code: 'ERROR' };
    }
}

export async function getStockOpnamesAction(
    statusFilter?: StockOpnameStatus
): Promise<OpnameActionResponse<StockOpnameDoc[]>> {
    try {
        await requirePermission('STOCK_OPNAME_VIEW');
        const list = await getStockOpnames(statusFilter);
        return { success: true, data: JSON.parse(JSON.stringify(list)) };
    } catch (err) {
        if (isAuthError(err)) return { success: false, error: err.message, code: err.code };
        return { success: false, error: 'Gagal mengambil daftar stock opname.' };
    }
}

export async function getStockOpnameDetailAction(
    stockOpnameId: string
): Promise<OpnameActionResponse<PopulatedOpnameDetail | null>> {
    try {
        await requirePermission('STOCK_OPNAME_VIEW');
        const detail = await getStockOpnameDetail(stockOpnameId);
        if (!detail) {
            return { success: false, error: 'Dokumen stock opname tidak ditemukan.' };
        }
        return { success: true, data: JSON.parse(JSON.stringify(detail)) };
    } catch (err) {
        if (isAuthError(err)) return { success: false, error: err.message, code: err.code };
        return { success: false, error: 'Gagal mengambil detail stock opname.' };
    }
}
