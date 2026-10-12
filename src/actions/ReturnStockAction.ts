'use server';

import { returnStock, ReturnStockResult } from '@/services/inventory/ReturnStockService';
import { isInventoryError } from '@/services/inventory/InventoryErrors';
import { requirePermission, isAuthError } from '@/lib/Auth';
import { TransactionResponse } from './TransactionTypes';

export type { ReturnStockResult };

export async function returnStockAction(
    formData: FormData
): Promise<TransactionResponse<ReturnStockResult>> {
    try {
        const user = await requirePermission('RETURN_CREATE');

        const itemId = formData.get('itemId') as string;
        const locationId = formData.get('locationId') as string;
        const quantity = parseInt(formData.get('quantity') as string, 10);
        const referenceNumber = (formData.get('referenceNumber') as string) || undefined;
        const reason = (formData.get('reason') as string) || undefined;

        if (!itemId || !locationId) {
            return { success: false, error: 'Item dan lokasi wajib diisi', code: 'INVALID_INPUT' };
        }

        const result = await returnStock({
            itemId,
            locationId,
            quantity,
            referenceNumber,
            reason,
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
        console.error('[returnStockAction]', err);
        return { success: false, error: 'Terjadi kesalahan tidak terduga', code: 'TRANSACTION_FAILED' };
    }
}
