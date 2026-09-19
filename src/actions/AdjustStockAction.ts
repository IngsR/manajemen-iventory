'use server';

import { adjustStock, AdjustStockResult } from '@/services/inventory/AdjustStockService';
import { isInventoryError } from '@/services/inventory/InventoryErrors';
import { TransactionResponse } from './TransactionTypes';

export type { AdjustStockResult };

export async function adjustStockAction(
    formData: FormData
): Promise<TransactionResponse<AdjustStockResult>> {
    try {
        const itemId = formData.get('itemId') as string;
        const locationId = formData.get('locationId') as string;
        const quantityDelta = parseInt(formData.get('quantityDelta') as string, 10);
        const reason = (formData.get('reason') as string) || '';
        const referenceNumber = (formData.get('referenceNumber') as string) || undefined;
        const actorName = (formData.get('actorName') as string) || 'Unknown';
        const actorRole = (formData.get('actorRole') as string) || 'Petugas';

        if (!itemId || !locationId) {
            return { success: false, error: 'Item dan lokasi wajib diisi', code: 'INVALID_INPUT' };
        }
        if (!reason.trim()) {
            return { success: false, error: 'Alasan koreksi wajib diisi', code: 'INVALID_INPUT' };
        }

        const result = await adjustStock({
            itemId,
            locationId,
            quantityDelta,
            reason,
            referenceNumber,
            actor: { name: actorName, role: actorRole },
        });

        return { success: true, data: result };
    } catch (err) {
        if (isInventoryError(err)) {
            return { success: false, error: err.message, code: err.code };
        }
        console.error('[adjustStockAction]', err);
        return { success: false, error: 'Terjadi kesalahan tidak terduga', code: 'TRANSACTION_FAILED' };
    }
}
