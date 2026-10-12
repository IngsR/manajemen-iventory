import { ObjectId, Collection } from 'mongodb';
import { getMongoDb } from '@/lib/MongoDb';

export type LocationType = 'STORAGE' | 'RECEIVING' | 'SHIPPING' | 'STAGING';

export interface LocationDoc {
    _id?: ObjectId;
    warehouseId: ObjectId;
    code: string;
    name: string;
    type: LocationType;
    status: 'ACTIVE' | 'INACTIVE';
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export async function getLocationCollection(): Promise<Collection<LocationDoc>> {
    const db = await getMongoDb();
    return db.collection<LocationDoc>('locations');
}

export async function initLocationIndexes(): Promise<void> {
    const collection = await getLocationCollection();
    await collection.createIndex(
        { warehouseId: 1, code: 1 },
        {
            unique: true,
            partialFilterExpression: { isDeleted: false },
            name: 'location_warehouse_code_unique_active',
        }
    );
    await collection.createIndex(
        { warehouseId: 1, isDeleted: 1, status: 1 },
        { name: 'location_warehouse_active_list_esr' }
    );
}
