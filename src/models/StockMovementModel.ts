import { ObjectId, Collection } from 'mongodb';
import { getMongoDb } from '@/lib/MongoDb';

export type MovementType = 'RECEIVE' | 'TRANSFER' | 'ISSUE' | 'RETURN' | 'ADJUSTMENT';

export interface MovementActor {
    userId?: ObjectId | null;
    name: string;
    role: string;
}

export interface StockMovementDoc {
    _id?: ObjectId;
    movementNumber: string;
    type: MovementType;
    itemId: ObjectId;
    sku: string;
    quantity: number;
    sourceWarehouseId?: ObjectId | null;
    sourceLocationId?: ObjectId | null;
    destinationWarehouseId?: ObjectId | null;
    destinationLocationId?: ObjectId | null;
    referenceNumber?: string;
    reason?: string;
    actor: MovementActor;
    timestamp: Date;
    createdAt: Date;
}

export async function getStockMovementCollection(): Promise<Collection<StockMovementDoc>> {
    const db = await getMongoDb();
    return db.collection<StockMovementDoc>('stock_movements');
}

export async function initStockMovementIndexes(): Promise<void> {
    const collection = await getStockMovementCollection();
    await collection.createIndex(
        { movementNumber: 1 },
        { unique: true, name: 'stock_movement_number_unique' }
    );
    await collection.createIndex(
        { itemId: 1, timestamp: -1 },
        { name: 'stock_movement_item_timeline_esr' }
    );
    await collection.createIndex(
        { sku: 1, timestamp: -1 },
        { name: 'stock_movement_sku_timeline_esr' }
    );
    await collection.createIndex(
        { type: 1, timestamp: -1 },
        { name: 'stock_movement_type_timeline_idx' }
    );
    await collection.createIndex(
        { sourceLocationId: 1, timestamp: -1 },
        { name: 'stock_movement_source_loc_timeline_idx' }
    );
    await collection.createIndex(
        { destinationLocationId: 1, timestamp: -1 },
        { name: 'stock_movement_dest_loc_timeline_idx' }
    );
}
