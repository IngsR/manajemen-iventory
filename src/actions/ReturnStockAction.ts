'use server';

import { returnStock, ReturnStockResult } from '@/services/inventory/ReturnStockService';
import { isInventoryError } from '@/services/inventory/InventoryErrors';
import { TransactionResponse } from './TransactionTypes';

export type { ReturnStockResult };

export async function returnStockAction(
    formData: FormData
): Promise<TransactionResponse<ReturnStockResult>> {
    try {
        const itemId = formData.get('itemId') as string;
        const locationId = formData.get('locationId') as string;
        const quantity = parseInt(formData.get('quantity') as string, 10);
        const referenceNumber = (formData.get('referenceNumber') as string) || undefined;
        const reason = (formData.get('reason') as string) || undefined;
        const actorName = (formData.get('actorName') as string) || 'Unknown';
        const actorRole = (formData.get('actorRole') as string) || 'Petugas';

        if (!itemId || !locationId) {
            return { success: false, error: 'Item dan lokasi wajib diisi', code: 'INVALID_INPUT' };
        }

        const result = await returnStock({
            itemId,
            locationId,
            quantity,
            referenceNumber,
            reason,
            actor: { name: actorName, role: actorRole },
        });

        return { success: true, data: result };
    } catch (err) {
        if (isInventoryError(err)) {
            return { success: false, error: err.message, code: err.code };
        }
        console.error('[returnStockAction]', err);
        return { success: false, error: 'Terjadi kesalahan tidak terduga', code: 'TRANSACTION_FAILED' };
    }
}
