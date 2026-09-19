import { ObjectId, ClientSession } from 'mongodb';
import {
    getAuditLogCollection,
    AuditLogDoc,
    AuditAction,
    AuditResource,
} from '@/models/AuditLogModel';

export interface CreateAuditLogInput {
    actorId: ObjectId | null;
    actorName: string;
    actorRole: string;
    action: AuditAction;
    resource: AuditResource;
    resourceId?: string;
    details?: Record<string, unknown>;
    timestamp?: Date;
}

/**
 * Appends a new immutable entry to audit_logs.
 * Can be called with a MongoDB session to be committed atomically within a transaction.
 * No update or delete functions are provided (strictly append-only).
 */
export async function createAuditLog(
    entry: CreateAuditLogInput,
    session?: ClientSession
): Promise<ObjectId> {
    const col = await getAuditLogCollection();
    const doc: AuditLogDoc = {
        _id: new ObjectId(),
        actorId: entry.actorId,
        actorName: entry.actorName,
        actorRole: entry.actorRole,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId,
        details: entry.details,
        timestamp: entry.timestamp || new Date(),
    };

    await col.insertOne(doc, session ? { session } : {});
    return doc._id;
}

/**
 * Fetches recent audit logs for the audit view page.
 */
export async function getRecentAuditLogs(limit = 100): Promise<AuditLogDoc[]> {
    const col = await getAuditLogCollection();
    return col
        .find({})
        .sort({ timestamp: -1 })
        .limit(Math.min(limit, 500))
        .toArray();
}
