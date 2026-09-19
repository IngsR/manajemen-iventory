'use server';

import { transferStock, TransferStockResult } from '@/services/inventory/TransferStockService';
import { isInventoryError } from '@/services/inventory/InventoryErrors';
import { requirePermission, isAuthError } from '@/lib/Auth';
import { TransactionResponse } from './TransactionTypes';

export type { TransferStockResult };

export async function transferStockAction(
    formData: FormData
): Promise<TransactionResponse<TransferStockResult>> {
    try {
        const user = await requirePermission('TRANSFER_CREATE');

        const itemId = formData.get('itemId') as string;
        const sourceLocationId = formData.get('sourceLocationId') as string;
        const destinationLocationId = formData.get('destinationLocationId') as string;
        const quantity = parseInt(formData.get('quantity') as string, 10);
        const referenceNumber = (formData.get('referenceNumber') as string) || undefined;
        const reason = (formData.get('reason') as string) || undefined;

        if (!itemId || !sourceLocationId || !destinationLocationId) {
            return {
                success: false,
                error: 'Item, lokasi asal, dan lokasi tujuan wajib diisi',
                code: 'INVALID_INPUT',
            };
        }

        const result = await transferStock({
            itemId,
            sourceLocationId,
            destinationLocationId,
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
        console.error('[transferStockAction]', err);
        return { success: false, error: 'Terjadi kesalahan tidak terduga', code: 'TRANSACTION_FAILED' };
    }
}
