import { ObjectId, Collection } from 'mongodb';
import { getMongoDb } from '@/lib/MongoDb';

export interface UnitDoc {
    _id?: ObjectId;
    code: string;
    name: string;
    status: 'ACTIVE' | 'INACTIVE';
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export async function getUnitCollection(): Promise<Collection<UnitDoc>> {
    const db = await getMongoDb();
    return db.collection<UnitDoc>('units');
}

export async function initUnitIndexes(): Promise<void> {
    const collection = await getUnitCollection();
    await collection.createIndex(
        { code: 1 },
        {
            unique: true,
            partialFilterExpression: { isDeleted: false },
            name: 'unit_code_unique_active',
        }
    );
    await collection.createIndex(
        { isDeleted: 1, status: 1 },
        { name: 'unit_active_list_esr' }
    );
}
