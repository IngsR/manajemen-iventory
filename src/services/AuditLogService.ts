import { ObjectId, ClientSession, Filter } from "mongodb";
import {
  getAuditLogCollection,
  AuditLogDoc,
  AuditAction,
  AuditResource,
} from "@/models/AuditLogModel";
import { UserDoc } from "@/models/UserModel";

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
 * Partial audit entry dari UserDoc.
 * Gunakan dengan spread: { ...auditActor(user), action: 'CREATE', ... }
 * Menghilangkan duplikasi actorId/actorName/actorRole di setiap action.
 */
export function auditActor(user: UserDoc) {
  return {
    actorId: user._id,
    actorName: user.name,
    actorRole: user.role,
  };
}

/**
 * Appends a new immutable entry to audit_logs.
 * Can be called with a MongoDB session to be committed atomically within a transaction.
 * No update or delete functions are provided (strictly append-only).
 */
export async function createAuditLog(
  entry: CreateAuditLogInput,
  session?: ClientSession,
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

export interface AuditLogFilter {
  resource?: string;
  actorId?: string;
  from?: Date;
  to?: Date;
}

/**
 * Fetches recent audit logs for the audit view page.
 * Semua parameter filter bersifat opsional — tanpa filter mengembalikan N log terbaru.
 */
export async function getRecentAuditLogs(
  limit = 100,
  filter: AuditLogFilter = {},
): Promise<AuditLogDoc[]> {
  const col = await getAuditLogCollection();
  const query: Filter<AuditLogDoc> = {};

  if (filter.resource) {
    query.resource = filter.resource as AuditResource;
  }
  if (filter.actorId && ObjectId.isValid(filter.actorId)) {
    query.actorId = new ObjectId(filter.actorId);
  }
  if (filter.from || filter.to) {
    query.timestamp = {};
    if (filter.from)
      (query.timestamp as Record<string, Date>).$gte = filter.from;
    if (filter.to) (query.timestamp as Record<string, Date>).$lte = filter.to;
  }

  return col
    .find(query)
    .sort({ timestamp: -1 })
    .limit(Math.min(limit, 500))
    .toArray();
}
