import { ObjectId, ClientSession } from 'mongodb';
import { getStockBalanceCollection } from '@/models/StockBalanceModel';
import { getMongoClient } from '@/lib/MongoDb';
import { InventoryError } from './InventoryErrors';

let _supportsTransactions: boolean | null = null;

/**
 * Checks if the current MongoDB deployment supports multi-document transactions
 * (i.e. is a Replica Set or Sharded cluster). Standalone instances do not.
 */
export async function isTransactionSupported(): Promise<boolean> {
    if (_supportsTransactions !== null) return _supportsTransactions;
    try {
        const client = await getMongoClient();
        const hello = await client.db('admin').command({ hello: 1 });
        _supportsTransactions = Boolean(hello.setName || hello.msg === 'isdbgrid');
    } catch {
        _supportsTransactions = false;
    }
    return _supportsTransactions;
}

/**
 * Executes an operation inside a MongoDB transaction if replica set is available,
 * or directly with atomic document operations if running in standalone mode.
 */
export async function withInventoryTransaction<T>(
    operation: (session?: ClientSession) => Promise<T>
): Promise<T> {
    const supported = await isTransactionSupported();
    if (!supported) {
        return await operation(undefined);
    }

    const client = await getMongoClient();
    const session = client.startSession();
    try {
        let result: T;
        await session.withTransaction(async () => {
            result = await operation(session);
        });
        return result!;
    } finally {
        await session.endSession();
    }
}

/**
 * Atomically increments stock balance for a given item + location.
 * Uses upsert so the first receive for a new location creates the document.
 */
export async function incrementBalance(
    session: ClientSession | undefined,
    itemId: ObjectId,
    sku: string,
    warehouseId: ObjectId,
    locationId: ObjectId,
    quantity: number
): Promise<void> {
    const col = await getStockBalanceCollection();
    await col.updateOne(
        { itemId, locationId },
        {
            $inc: { quantity },
            $set: { sku, warehouseId, updatedAt: new Date() },
            $setOnInsert: { itemId, locationId },
        },
        { upsert: true, ...(session ? { session } : {}) }
    );
}

/**
 * Atomically decrements stock balance with a guard to prevent negative stock.
 * Uses a conditional filter: quantity >= requestedQty.
 * Returns true if the update succeeded, false if stock was insufficient.
 */
export async function decrementBalance(
    session: ClientSession | undefined,
    itemId: ObjectId,
    locationId: ObjectId,
    quantity: number
): Promise<boolean> {
    const col = await getStockBalanceCollection();
    const result = await col.updateOne(
        { itemId, locationId, quantity: { $gte: quantity } },
        {
            $inc: { quantity: -quantity },
            $set: { updatedAt: new Date() },
        },
        session ? { session } : {}
    );

    // matchedCount === 0 means either doc not found or stock < quantity
    return result.matchedCount === 1;
}

/**
 * Retrieves current stock quantity for an item at a specific location.
 * Returns 0 if no stock record exists yet.
 */
export async function getCurrentBalance(
    itemId: ObjectId,
    locationId: ObjectId,
    session?: ClientSession
): Promise<number> {
    const col = await getStockBalanceCollection();
    const doc = await col.findOne({ itemId, locationId }, { ...(session ? { session } : {}) });
    return doc?.quantity ?? 0;
}

export { InventoryError };
