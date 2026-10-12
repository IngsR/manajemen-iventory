/**
 * InventoryReportService.ts
 *
 * Read-only service for paginated inventory reports.
 * Provides movement report with filters and stock opname list.
 *
 * This service NEVER writes to any collection.
 */

import { ObjectId, Filter } from 'mongodb';
import { getStockMovementCollection, StockMovementDoc, MovementType } from '@/models/StockMovementModel';
import { getStockOpnameCollection, StockOpnameDoc, StockOpnameStatus } from '@/models/StockOpnameModel';
import { getStockOpnameItemCollection } from '@/models/StockOpnameModel';
import { getWarehouseCollection } from '@/models/WarehouseModel';

// ── Types ────────────────────────────────────────────────────────────────────

export interface MovementReportFilters {
    dateFrom?: Date;
    dateTo?: Date;
    type?: MovementType;
    sku?: string;
    warehouseId?: string;
    locationId?: string;
    actor?: string;
}

export interface MovementReportRow {
    _id: string;
    movementNumber: string;
    timestamp: Date;
    type: MovementType;
    sku: string;
    quantity: number;
    sourceWarehouseId?: string | null;
    sourceLocationId?: string | null;
    destinationWarehouseId?: string | null;
    destinationLocationId?: string | null;
    referenceNumber?: string;
    actorName: string;
    actorRole: string;
    reason?: string;
}

export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface OpnameReportFilters {
    status?: StockOpnameStatus;
    warehouseId?: string;
}

export interface OpnameReportRow {
    _id: string;
    opnameNumber: string;
    warehouseId: string;
    warehouseName?: string;
    status: StockOpnameStatus;
    createdByName: string;
    reviewedByName?: string;
    createdAt: Date;
    submittedAt?: Date;
    reviewedAt?: Date;
    itemCount: number;
    totalVariance: number;
}

// ── Movement Report ──────────────────────────────────────────────────────────

export async function getMovementReport(
    filters: MovementReportFilters,
    page = 1,
    pageSize = 20
): Promise<PaginatedResult<MovementReportRow>> {
    const col = await getStockMovementCollection();
    const query: Filter<StockMovementDoc> = {};

    // Date range
    if (filters.dateFrom || filters.dateTo) {
        query.timestamp = {};
        if (filters.dateFrom) (query.timestamp as Record<string, Date>).$gte = filters.dateFrom;
        if (filters.dateTo) (query.timestamp as Record<string, Date>).$lte = filters.dateTo;
    }

    // Type filter
    if (filters.type) {
        query.type = filters.type;
    }

    // SKU filter (partial match, case-insensitive)
    if (filters.sku) {
        query.sku = { $regex: filters.sku, $options: 'i' } as unknown as string;
    }

    // Warehouse filter: match either source or destination warehouse
    if (filters.warehouseId && ObjectId.isValid(filters.warehouseId)) {
        const whId = new ObjectId(filters.warehouseId);
        query.$or = [
            { sourceWarehouseId: whId },
            { destinationWarehouseId: whId },
        ];
    }

    // Location filter: match either source or destination location
    if (filters.locationId && ObjectId.isValid(filters.locationId)) {
        const locId = new ObjectId(filters.locationId);
        // If $or already exists from warehouse, combine via $and
        const locOr = [
            { sourceLocationId: locId },
            { destinationLocationId: locId },
        ];
        if (query.$or) {
            query.$and = [{ $or: query.$or }, { $or: locOr }];
            delete query.$or;
        } else {
            query.$or = locOr;
        }
    }

    // Actor name filter (partial match)
    if (filters.actor) {
        query['actor.name'] = { $regex: filters.actor, $options: 'i' } as unknown as string;
    }

    const skip = (page - 1) * pageSize;
    const [total, docs] = await Promise.all([
        col.countDocuments(query),
        col.find(query)
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(pageSize)
            .toArray(),
    ]);

    const data: MovementReportRow[] = docs.map((d) => ({
        _id: String(d._id),
        movementNumber: d.movementNumber,
        timestamp: d.timestamp,
        type: d.type,
        sku: d.sku,
        quantity: d.quantity,
        sourceWarehouseId: d.sourceWarehouseId ? String(d.sourceWarehouseId) : null,
        sourceLocationId: d.sourceLocationId ? String(d.sourceLocationId) : null,
        destinationWarehouseId: d.destinationWarehouseId ? String(d.destinationWarehouseId) : null,
        destinationLocationId: d.destinationLocationId ? String(d.destinationLocationId) : null,
        referenceNumber: d.referenceNumber,
        actorName: d.actor?.name ?? '-',
        actorRole: d.actor?.role ?? '-',
        reason: d.reason,
    }));

    return {
        data,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
    };
}

// ── Stock Opname Report ──────────────────────────────────────────────────────

export async function getOpnameReport(
    filters: OpnameReportFilters,
    page = 1,
    pageSize = 20
): Promise<PaginatedResult<OpnameReportRow>> {
    const col = await getStockOpnameCollection();
    const itemCol = await getStockOpnameItemCollection();

    const query: Filter<StockOpnameDoc> = {};
    if (filters.status) query.status = filters.status;
    if (filters.warehouseId && ObjectId.isValid(filters.warehouseId)) {
        query.warehouseId = new ObjectId(filters.warehouseId);
    }

    const skip = (page - 1) * pageSize;
    const [total, docs] = await Promise.all([
        col.countDocuments(query),
        col.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageSize)
            .toArray(),
    ]);

    // Get item counts and variance per opname
    const opnameIds = docs.map((d) => d._id);
    const itemStats = await itemCol.aggregate<{ _id: ObjectId; count: number; totalVariance: number }>([
        { $match: { stockOpnameId: { $in: opnameIds } } },
        {
            $group: {
                _id: '$stockOpnameId',
                count: { $sum: 1 },
                totalVariance: { $sum: { $abs: '$difference' } },
            },
        },
    ]).toArray();

    const statsMap = new Map(itemStats.map((ic) => [String(ic._id), { count: ic.count, totalVariance: ic.totalVariance ?? 0 }]));

    const warehouseCol = await getWarehouseCollection();
    const warehouseIds = Array.from(new Set(docs.map((d) => d.warehouseId)));
    const warehouses = await warehouseCol.find({ _id: { $in: warehouseIds } }).toArray();
    const whMap = new Map(warehouses.map((w) => [w._id.toHexString(), w.name]));

    const data: OpnameReportRow[] = docs.map((d) => {
        const stats = statsMap.get(String(d._id)) ?? { count: 0, totalVariance: 0 };
        return {
            _id: String(d._id),
            opnameNumber: d.opnameNumber,
            warehouseId: String(d.warehouseId),
            warehouseName: whMap.get(d.warehouseId.toHexString()) ?? 'Gudang',
            status: d.status,
            createdByName: d.createdBy?.name ?? '-',
            reviewedByName: d.reviewedBy?.name,
            createdAt: d.createdAt,
            submittedAt: d.submittedAt,
            reviewedAt: d.reviewedAt,
            itemCount: stats.count,
            totalVariance: stats.totalVariance,
        };
    });

    return {
        data,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
    };
}
