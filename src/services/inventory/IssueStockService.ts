import { generateMovementNumber } from '@/lib/AtomicCounter';
import { getStockMovementCollection } from '@/models/StockMovementModel';
import { InventoryError } from './InventoryErrors';
import { validateItem, validateLocation, validateQuantity } from './InventoryValidation';
import { decrementBalance, getCurrentBalance, withInventoryTransaction } from './InventoryStockHelper';
import { ObjectId } from 'mongodb';

export interface IssueStockInput {
    itemId: string;
    locationId: string;
    quantity: number;
    referenceNumber?: string;
    reason?: string;
    actor: { name: string; role: string };
}

export interface IssueStockResult {
    success: true;
    movementNumber: string;
    stockBefore: number;
    stockAfter: number;
    message: string;
}

export async function issueStock(input: IssueStockInput): Promise<IssueStockResult> {
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
        const success = await decrementBalance(session, itemOid, locationOid, quantity);
        if (!success) {
            throw new InventoryError(
                'INSUFFICIENT_STOCK',
                `Insufficient stock: requested ${quantity}, available ${stockBefore} at ${location.name}`
            );
        }

        const movements = await getStockMovementCollection();
        await movements.insertOne(
            {
                movementNumber,
                type: 'ISSUE',
                itemId: itemOid,
                sku: item.sku,
                quantity,
                sourceWarehouseId: location.warehouseId,
                sourceLocationId: locationOid,
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
        stockAfter: stockBefore - quantity,
        message: `Issued ${quantity} unit(s) of ${item.name} from ${location.name}`,
    };
}
