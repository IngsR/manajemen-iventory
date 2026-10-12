import { generateMovementNumber } from '@/lib/AtomicCounter';
import { getStockMovementCollection } from '@/models/StockMovementModel';
import { createAuditLog } from '@/services/AuditLogService';
import { InventoryError } from './InventoryErrors';
import { validateItem, validateLocation, validateQuantity } from './InventoryValidation';
import { decrementBalance, incrementBalance, getCurrentBalance, withInventoryTransaction } from './InventoryStockHelper';
import { ObjectId } from 'mongodb';

export interface TransferStockInput {
    itemId: string;
    sourceLocationId: string;
    destinationLocationId: string;
    quantity: number;
    referenceNumber?: string;
    reason?: string;
    actor: { name: string; role: string; userId?: string | null };
}

export interface TransferStockResult {
    success: true;
    movementNumber: string;
    stockAtSource: { before: number; after: number };
    message: string;
}

export async function transferStock(input: TransferStockInput): Promise<TransferStockResult> {
    const { itemId, sourceLocationId, destinationLocationId, quantity, referenceNumber, reason, actor } = input;

    validateQuantity(quantity);

    if (sourceLocationId === destinationLocationId) {
        throw new InventoryError('SAME_LOCATION_TRANSFER', 'Source and destination location must be different');
    }

    const item = await validateItem(itemId);
    const sourceLocation = await validateLocation(sourceLocationId);
    const destLocation = await validateLocation(destinationLocationId);

    const movementNumber = await generateMovementNumber();
    const now = new Date();
    const itemOid = new ObjectId(itemId);
    const sourceOid = new ObjectId(sourceLocationId);
    const destOid = new ObjectId(destinationLocationId);
    const actorOid = actor.userId && ObjectId.isValid(actor.userId) ? new ObjectId(actor.userId) : null;

    const stockBefore = await getCurrentBalance(itemOid, sourceOid);

    await withInventoryTransaction(async (session) => {
        // Decrement source (with guard)
        const success = await decrementBalance(session, itemOid, sourceOid, quantity);
        if (!success) {
            throw new InventoryError(
                'INSUFFICIENT_STOCK',
                `Insufficient stock at source: requested ${quantity}, available ${stockBefore} at ${sourceLocation.name}`
            );
        }

        try {
            // Increment destination
            await incrementBalance(
                session,
                itemOid,
                item.sku,
                destLocation.warehouseId,
                destOid,
                quantity
            );

            const movements = await getStockMovementCollection();
            await movements.insertOne(
                {
                    movementNumber,
                    type: 'TRANSFER',
                    itemId: itemOid,
                    sku: item.sku,
                    quantity,
                    sourceWarehouseId: sourceLocation.warehouseId,
                    sourceLocationId: sourceOid,
                    destinationWarehouseId: destLocation.warehouseId,
                    destinationLocationId: destOid,
                    referenceNumber: referenceNumber || undefined,
                    reason: reason || undefined,
                    actor: { name: actor.name, role: actor.role, userId: actorOid },
                    timestamp: now,
                    createdAt: now,
                },
                session ? { session } : {}
            );

            // Atomic audit log
            await createAuditLog(
                {
                    actorId: actorOid,
                    actorName: actor.name,
                    actorRole: actor.role,
                    action: 'TRANSFER',
                    resource: 'STOCK',
                    resourceId: movementNumber,
                    details: {
                        itemId: itemOid.toHexString(),
                        sku: item.sku,
                        itemName: item.name,
                        quantity,
                        sourceLocationId: sourceOid.toHexString(),
                        destinationLocationId: destOid.toHexString(),
                        referenceNumber,
                        reason,
                    },
                    timestamp: now,
                },
                session
            );
        } catch (innerErr) {
            // In standalone mode (no session/transaction), compensate source balance if increment or insert failed
            if (!session) {
                await incrementBalance(undefined, itemOid, item.sku, sourceLocation.warehouseId, sourceOid, quantity);
            }
            throw innerErr;
        }
    });

    return {
        success: true,
        movementNumber,
        stockAtSource: { before: stockBefore, after: stockBefore - quantity },
        message: `Transferred ${quantity} unit(s) of ${item.name} from ${sourceLocation.name} → ${destLocation.name}`,
    };
}
