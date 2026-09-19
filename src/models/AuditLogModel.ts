import { Collection, ObjectId } from 'mongodb';
import { getMongoDb } from '@/lib/MongoDb';

export type AuditAction =
    | 'CREATE'
    | 'UPDATE'
    | 'DELETE'
    | 'LOGIN'
    | 'LOGOUT'
    | 'RECEIVE'
    | 'ISSUE'
    | 'TRANSFER'
    | 'RETURN'
    | 'ADJUSTMENT';

export type AuditResource =
    | 'USER'
    | 'ITEM'
    | 'CATEGORY'
    | 'UNIT'
    | 'WAREHOUSE'
    | 'LOCATION'
    | 'STOCK'
    | 'MOVEMENT'
    | 'STOCK_OPNAME'
    | 'AUTH';

export interface AuditLogDoc {
    _id: ObjectId;
    actorId: ObjectId | null;
    actorName: string;
    actorRole: string;
    action: AuditAction;
    resource: AuditResource;
    resourceId?: string;
    details?: Record<string, unknown>;
    timestamp: Date;
}

const COLLECTION_NAME = 'audit_logs';

export async function getAuditLogCollection(): Promise<Collection<AuditLogDoc>> {
    const db = await getMongoDb();
    return db.collection<AuditLogDoc>(COLLECTION_NAME);
}

export async function initAuditLogIndexes(): Promise<void> {
    const col = await getAuditLogCollection();
    await col.createIndex({ timestamp: -1 }, { name: 'idx_timestamp' });
    await col.createIndex({ resource: 1, timestamp: -1 }, { name: 'idx_resource_timestamp' });
    await col.createIndex({ actorId: 1, timestamp: -1 }, { name: 'idx_actorId_timestamp' });
    await col.createIndex({ action: 1, timestamp: -1 }, { name: 'idx_action_timestamp' });
}
