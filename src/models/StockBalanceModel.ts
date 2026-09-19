import { ObjectId, Collection } from 'mongodb';
import { getMongoDb } from '@/lib/MongoDb';

export interface StockBalanceDoc {
    _id?: ObjectId;
    itemId: ObjectId;
    sku: string;
    warehouseId: ObjectId;
    locationId: ObjectId;
    quantity: number;
    updatedAt: Date;
}

export async function getStockBalanceCollection(): Promise<Collection<StockBalanceDoc>> {
    const db = await getMongoDb();
    return db.collection<StockBalanceDoc>('stock_balances');
}

export async function initStockBalanceIndexes(): Promise<void> {
    const collection = await getStockBalanceCollection();
    // 1 SKU only has 1 balance record per location
    await collection.createIndex(
        { itemId: 1, locationId: 1 },
        { unique: true, name: 'stock_balance_item_location_unique' }
    );
    // ESR for warehouse/location stock querying
    await collection.createIndex(
        { warehouseId: 1, locationId: 1, quantity: 1 },
        { name: 'stock_balance_warehouse_location_esr' }
    );
    // Stock of SKU per warehouse lookup
    await collection.createIndex(
        { sku: 1, warehouseId: 1 },
        { name: 'stock_balance_sku_warehouse_idx' }
    );
}
