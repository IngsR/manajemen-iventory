import { Collection, ObjectId } from 'mongodb';
import { getMongoDb } from '@/lib/MongoDb';

export type UserRole = 'ADMIN' | 'SUPERVISOR' | 'PETUGAS';
export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface UserDoc {
    _id: ObjectId;
    name: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    status: UserStatus;
    createdAt: Date;
    updatedAt: Date;
}

const COLLECTION_NAME = 'users';

export async function getUserCollection(): Promise<Collection<UserDoc>> {
    const db = await getMongoDb();
    return db.collection<UserDoc>(COLLECTION_NAME);
}

export async function initUserIndexes(): Promise<void> {
    const col = await getUserCollection();
    // Unique index on email
    await col.createIndex({ email: 1 }, { unique: true, name: 'uniq_email' });
    await col.createIndex({ role: 1 }, { name: 'idx_role' });
    await col.createIndex({ status: 1 }, { name: 'idx_status' });
}
