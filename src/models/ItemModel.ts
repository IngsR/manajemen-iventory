import { ObjectId, Collection } from 'mongodb';
import { getMongoDb } from '@/lib/MongoDb';

export interface ItemDoc {
    _id?: ObjectId;
    sku: string;
    name: string;
    description?: string;
    categoryId: ObjectId;
    unitId: ObjectId;
    minStock: number;
    status: 'ACTIVE' | 'INACTIVE';
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export async function getItemCollection(): Promise<Collection<ItemDoc>> {
    const db = await getMongoDb();
    return db.collection<ItemDoc>('items');
}

export async function initItemIndexes(): Promise<void> {
    const collection = await getItemCollection();
    await collection.createIndex(
        { sku: 1 },
        {
            unique: true,
            partialFilterExpression: { isDeleted: false },
            name: 'item_sku_unique_active',
        }
    );
    await collection.createIndex(
        { categoryId: 1, isDeleted: 1 },
        { name: 'item_category_ref_idx' }
    );
    await collection.createIndex(
        { unitId: 1, isDeleted: 1 },
        { name: 'item_unit_ref_idx' }
    );
    await collection.createIndex(
        { isDeleted: 1, status: 1, name: 1 },
        { name: 'item_active_list_esr' }
    );
}
