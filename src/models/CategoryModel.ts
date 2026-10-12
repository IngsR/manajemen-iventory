import { ObjectId, Collection } from 'mongodb';
import { getMongoDb } from '@/lib/MongoDb';

export interface CategoryDoc {
    _id?: ObjectId;
    code: string;
    name: string;
    description?: string;
    status: 'ACTIVE' | 'INACTIVE';
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export async function getCategoryCollection(): Promise<Collection<CategoryDoc>> {
    const db = await getMongoDb();
    return db.collection<CategoryDoc>('categories');
}

export async function initCategoryIndexes(): Promise<void> {
    const collection = await getCategoryCollection();
    await collection.createIndex(
        { code: 1 },
        {
            unique: true,
            partialFilterExpression: { isDeleted: false },
            name: 'category_code_unique_active',
        }
    );
    await collection.createIndex(
        { isDeleted: 1, status: 1, name: 1 },
        { name: 'category_active_list_esr' }
    );
}
