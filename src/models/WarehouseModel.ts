import { ObjectId, Collection } from 'mongodb';
import { getMongoDb } from '@/lib/MongoDb';

export interface WarehouseDoc {
    _id?: ObjectId;
    code: string;
    name: string;
    address?: string;
    status: 'ACTIVE' | 'INACTIVE';
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export async function getWarehouseCollection(): Promise<Collection<WarehouseDoc>> {
    const db = await getMongoDb();
    return db.collection<WarehouseDoc>('warehouses');
}

export async function initWarehouseIndexes(): Promise<void> {
    const collection = await getWarehouseCollection();
    await collection.createIndex(
        { code: 1 },
        {
            unique: true,
            partialFilterExpression: { isDeleted: false },
            name: 'warehouse_code_unique_active',
        }
    );
    await collection.createIndex(
        { isDeleted: 1, status: 1 },
        { name: 'warehouse_active_list_esr' }
    );
}
