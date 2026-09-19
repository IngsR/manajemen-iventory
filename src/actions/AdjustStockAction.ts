'use server';

import { adjustStock, AdjustStockResult } from '@/services/inventory/AdjustStockService';
import { isInventoryError } from '@/services/inventory/InventoryErrors';
import { requirePermission, isAuthError } from '@/lib/Auth';
import { TransactionResponse } from './TransactionTypes';

export type { AdjustStockResult };

export async function adjustStockAction(
    formData: FormData
): Promise<TransactionResponse<AdjustStockResult>> {
    try {
        const user = await requirePermission('ADJUSTMENT_CREATE');

        const itemId = formData.get('itemId') as string;
        const locationId = formData.get('locationId') as string;
        const quantityDelta = parseInt(formData.get('quantityDelta') as string, 10);
        const reason = formData.get('reason') as string;
        const referenceNumber = (formData.get('referenceNumber') as string) || undefined;

        if (!itemId || !locationId || isNaN(quantityDelta) || quantityDelta === 0) {
            return {
                success: false,
                error: 'Item, lokasi, dan selisih quantity (tidak boleh 0) wajib diisi',
                code: 'INVALID_INPUT',
            };
        }

        if (!reason || reason.trim().length === 0) {
            return { success: false, error: 'Alasan penyesuaian stok wajib diisi', code: 'INVALID_INPUT' };
        }

        const result = await adjustStock({
            itemId,
            locationId,
            quantityDelta,
            reason: reason.trim(),
            referenceNumber,
            actor: {
                name: user.name,
                role: user.role,
                userId: user._id.toHexString(),
            },
        });

        return { success: true, data: result };
    } catch (err) {
        if (isAuthError(err)) {
            return { success: false, error: err.message, code: err.code };
        }
        if (isInventoryError(err)) {
            return { success: false, error: err.message, code: err.code };
        }
        console.error('[adjustStockAction]', err);
        return { success: false, error: 'Terjadi kesalahan tidak terduga', code: 'TRANSACTION_FAILED' };
    }
}
