import { generateMovementNumber } from '@/lib/AtomicCounter';
import { getStockMovementCollection } from '@/models/StockMovementModel';
import { InventoryError } from './InventoryErrors';
import { validateItem, validateLocation, validateQuantity } from './InventoryValidation';
import { decrementBalance, incrementBalance, getCurrentBalance, withInventoryTransaction } from './InventoryStockHelper';
import { ObjectId } from 'mongodb';

export interface AdjustStockInput {
    itemId: string;
    locationId: string;
    /** Positive = add stock, Negative = remove stock. Must not be zero. */
    quantityDelta: number;
    reason: string; // Required for audit trail
    referenceNumber?: string;
    actor: { name: string; role: string };
}

export interface AdjustStockResult {
    success: true;
    movementNumber: string;
    stockBefore: number;
    stockAfter: number;
    message: string;
}

export async function adjustStock(input: AdjustStockInput): Promise<AdjustStockResult> {
    const { itemId, locationId, quantityDelta, reason, referenceNumber, actor } = input;

    if (!reason || reason.trim().length === 0) {
        throw new InventoryError('INVALID_INPUT', 'Adjustment reason is required');
    }

    // Allow negative delta for adjustment; quantity must not be zero
    validateQuantity(quantityDelta, true);

    const item = await validateItem(itemId);
    const location = await validateLocation(locationId);

    const movementNumber = await generateMovementNumber();
    const now = new Date();
    const itemOid = new ObjectId(itemId);
    const locationOid = new ObjectId(locationId);

    const stockBefore = await getCurrentBalance(itemOid, locationOid);
    const absQty = Math.abs(quantityDelta);
    const isPositive = quantityDelta > 0;

    await withInventoryTransaction(async (session) => {
        if (isPositive) {
            await incrementBalance(
                session,
                itemOid,
                item.sku,
                location.warehouseId,
                locationOid,
                absQty
            );
        } else {
            const success = await decrementBalance(session, itemOid, locationOid, absQty);
            if (!success) {
                throw new InventoryError(
                    'INSUFFICIENT_STOCK',
                    `Adjustment would result in negative stock: current ${stockBefore}, delta ${quantityDelta} at ${location.name}`
                );
            }
        }

        const movements = await getStockMovementCollection();
        await movements.insertOne(
            {
                movementNumber,
                type: 'ADJUSTMENT',
                itemId: itemOid,
                sku: item.sku,
                quantity: quantityDelta, // Can be negative to indicate direction
                ...(isPositive
                    ? { destinationWarehouseId: location.warehouseId, destinationLocationId: locationOid }
                    : { sourceWarehouseId: location.warehouseId, sourceLocationId: locationOid }),
                referenceNumber: referenceNumber || undefined,
                reason: reason.trim(),
                actor: { name: actor.name, role: actor.role, userId: null },
                timestamp: now,
                createdAt: now,
            },
            session ? { session } : {}
        );
    });

    return {
        success: true,
        movementNumber,
        stockBefore,
        stockAfter: stockBefore + quantityDelta,
        message: `Adjusted stock of ${item.name} at ${location.name}: ${quantityDelta > 0 ? '+' : ''}${quantityDelta} (${reason})`,
    };
}
