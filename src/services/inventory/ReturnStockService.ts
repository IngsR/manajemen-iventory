import { generateMovementNumber } from '@/lib/AtomicCounter';
import { getStockMovementCollection } from '@/models/StockMovementModel';
import { validateItem, validateLocation, validateQuantity } from './InventoryValidation';
import { incrementBalance, getCurrentBalance, withInventoryTransaction } from './InventoryStockHelper';
import { ObjectId } from 'mongodb';

export interface ReturnStockInput {
    itemId: string;
    locationId: string;
    quantity: number;
    referenceNumber?: string;
    reason?: string;
    actor: { name: string; role: string };
}

export interface ReturnStockResult {
    success: true;
    movementNumber: string;
    stockBefore: number;
    stockAfter: number;
    message: string;
}

export async function returnStock(input: ReturnStockInput): Promise<ReturnStockResult> {
    const { itemId, locationId, quantity, referenceNumber, reason, actor } = input;

    validateQuantity(quantity);
    const item = await validateItem(itemId);
    const location = await validateLocation(locationId);

    const movementNumber = await generateMovementNumber();
    const now = new Date();
    const itemOid = new ObjectId(itemId);
    const locationOid = new ObjectId(locationId);

    const stockBefore = await getCurrentBalance(itemOid, locationOid);

    await withInventoryTransaction(async (session) => {
        await incrementBalance(
            session,
            itemOid,
            item.sku,
            location.warehouseId,
            locationOid,
            quantity
        );

        const movements = await getStockMovementCollection();
        await movements.insertOne(
            {
                movementNumber,
                type: 'RETURN',
                itemId: itemOid,
                sku: item.sku,
                quantity,
                destinationWarehouseId: location.warehouseId,
                destinationLocationId: locationOid,
                referenceNumber: referenceNumber || undefined,
                reason: reason || undefined,
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
        stockAfter: stockBefore + quantity,
        message: `Returned ${quantity} unit(s) of ${item.name} to ${location.name}`,
    };
}
