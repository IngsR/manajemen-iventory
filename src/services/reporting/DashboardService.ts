/**
 * DashboardService.ts
 *
 * Read-only service for dashboard metrics.
 * All data comes from existing collections: items, warehouses, locations,
 * stock_balances, stock_movements, stock_opnames.
 *
 * This service NEVER writes to any collection.
 *
 * Performance strategy (KISS):
 *  1. Each metric is a single MongoDB round-trip — no client-side re-scans.
 *  2. Independent queries run in parallel via Promise.all.
 *  3. Results are wrapped in a short-TTL in-process cache (`@/lib/Cache`) so
 *     repeated navigations / concurrent requests don't re-query the database.
 */

import { cached, CacheTTL } from "@/lib/Cache";
import { getItemCollection } from "@/models/ItemModel";
import { getLocationCollection } from "@/models/LocationModel";
import { getStockBalanceCollection } from "@/models/StockBalanceModel";
import {
  getStockMovementCollection,
  MovementType,
} from "@/models/StockMovementModel";
import {
  getStockOpnameCollection,
  StockOpnameStatus,
} from "@/models/StockOpnameModel";
import { getWarehouseCollection } from "@/models/WarehouseModel";

// ── Types ────────────────────────────────────────────────────────────────────

export interface DashboardCounts {
  activeItems: number;
  activeWarehouses: number;
  activeLocations: number;
  totalInventoryQty: number;
  lowStockCount: number;
}

export interface MovementSummaryItem {
  type: MovementType;
  count: number;
  totalQuantity: number;
}

export interface OpnameSummaryItem {
  status: StockOpnameStatus;
  count: number;
}

export interface LowStockItem {
  itemId: string;
  sku: string;
  name: string;
  minStock: number;
  totalStock: number;
  deficit: number;
}

export interface RecentMovement {
  _id: string;
  movementNumber: string;
  type: MovementType;
  sku: string;
  quantity: number;
  timestamp: Date;
  actorName: string;
}

// ── Dashboard Count Queries ──────────────────────────────────────────────────

export async function getActiveItemCount(): Promise<number> {
  return cached("dash:activeItems", CacheTTL.MASTER_DATA, async () => {
    const col = await getItemCollection();
    return col.countDocuments({ isDeleted: false, status: "ACTIVE" });
  });
}

export async function getActiveWarehouseCount(): Promise<number> {
  return cached("dash:activeWarehouses", CacheTTL.MASTER_DATA, async () => {
    const col = await getWarehouseCollection();
    return col.countDocuments({ isDeleted: false, status: "ACTIVE" });
  });
}

export async function getActiveLocationCount(): Promise<number> {
  return cached("dash:activeLocations", CacheTTL.MASTER_DATA, async () => {
    const col = await getLocationCollection();
    return col.countDocuments({ isDeleted: false, status: "ACTIVE" });
  });
}

export async function getTotalInventoryQuantity(): Promise<number> {
  return cached("dash:totalInventoryQty", CacheTTL.LEDGER, async () => {
    const col = await getStockBalanceCollection();
    const result = await col
      .aggregate([{ $group: { _id: null, total: { $sum: "$quantity" } } }])
      .toArray();
    return result[0]?.total ?? 0;
  });
}

// ── Low Stock ────────────────────────────────────────────────────────────────

/**
 * Aggregates total stock per item (sum across all locations),
 * then joins with items collection to compare with minStock.
 * Only items with minStock > 0 are considered.
 */
export async function getLowStockItems(limit = 50): Promise<LowStockItem[]> {
  return cached(`dash:lowStock:${limit}`, CacheTTL.LEDGER, async () => {
    const col = await getStockBalanceCollection();
    const pipeline = [
      // Sum quantity per itemId across all locations
      {
        $group: {
          _id: "$itemId",
          totalStock: { $sum: "$quantity" },
        },
      },
      // Join with items to get minStock, sku, name
      {
        $lookup: {
          from: "items",
          localField: "_id",
          foreignField: "_id",
          as: "item",
        },
      },
      { $unwind: "$item" },
      // Only active items with minStock defined
      {
        $match: {
          "item.isDeleted": false,
          "item.status": "ACTIVE",
          "item.minStock": { $gt: 0 },
        },
      },
      // Filter: totalStock <= minStock
      {
        $match: {
          $expr: { $lte: ["$totalStock", "$item.minStock"] },
        },
      },
      // Shape output
      {
        $project: {
          _id: 0,
          itemId: { $toString: "$_id" },
          sku: "$item.sku",
          name: "$item.name",
          minStock: "$item.minStock",
          totalStock: 1,
          deficit: { $subtract: ["$item.minStock", "$totalStock"] },
        },
      },
      { $sort: { deficit: -1 as const } },
      { $limit: limit },
    ];
    return col.aggregate<LowStockItem>(pipeline).toArray();
  });
}

export async function getLowStockCount(): Promise<number> {
  return cached("dash:lowStockCount", CacheTTL.LEDGER, async () => {
    const items = await getLowStockItems(9999);
    return items.length;
  });
}

// ── Movement Summary ─────────────────────────────────────────────────────────

/**
 * Aggregates stock movement counts and total quantity by type
 * within an optional date range.
 */
export async function getMovementSummary(
  dateFrom?: Date,
  dateTo?: Date,
): Promise<MovementSummaryItem[]> {
  // Only the unfiltered (dashboard) variant is cached; filtered reports
  // pass explicit dates and bypass the cache.
  const useCache = !dateFrom && !dateTo;

  const run = async (): Promise<MovementSummaryItem[]> => {
    const col = await getStockMovementCollection();

    const matchStage: Record<string, unknown> = {};
    if (dateFrom || dateTo) {
      matchStage.timestamp = {};
      if (dateFrom)
        (matchStage.timestamp as Record<string, Date>).$gte = dateFrom;
      if (dateTo) (matchStage.timestamp as Record<string, Date>).$lte = dateTo;
    }

    const pipeline = [
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" },
        },
      },
      {
        $project: {
          _id: 0,
          type: "$_id",
          count: 1,
          totalQuantity: 1,
        },
      },
      { $sort: { type: 1 as const } },
    ];

    return col.aggregate<MovementSummaryItem>(pipeline).toArray();
  };

  return useCache
    ? cached("dash:movementSummary", CacheTTL.LEDGER, run)
    : run();
}

// ── Opname Summary ───────────────────────────────────────────────────────────

export async function getOpnameSummary(): Promise<OpnameSummaryItem[]> {
  return cached("dash:opnameSummary", CacheTTL.LEDGER, async () => {
    const col = await getStockOpnameCollection();
    const pipeline = [
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          status: "$_id",
          count: 1,
        },
      },
      { $sort: { status: 1 as const } },
    ];
    return col.aggregate<OpnameSummaryItem>(pipeline).toArray();
  });
}

// ── Recent Movements ─────────────────────────────────────────────────────────

export async function getRecentMovements(
  limit = 10,
): Promise<RecentMovement[]> {
  return cached(`dash:recentMovements:${limit}`, CacheTTL.RECENT, async () => {
    const col = await getStockMovementCollection();
    const docs = await col
      .find({})
      .sort({ timestamp: -1 })
      .limit(limit)
      .project({
        movementNumber: 1,
        type: 1,
        sku: 1,
        quantity: 1,
        timestamp: 1,
        "actor.name": 1,
      })
      .toArray();

    return docs.map((d) => ({
      _id: String(d._id),
      movementNumber: d.movementNumber,
      type: d.type,
      sku: d.sku,
      quantity: d.quantity,
      timestamp: d.timestamp,
      actorName: d.actor?.name ?? "-",
    }));
  });
}

// ── Combined Dashboard Data ──────────────────────────────────────────────────

export async function getDashboardCounts(): Promise<DashboardCounts> {
  const [
    activeItems,
    activeWarehouses,
    activeLocations,
    totalInventoryQty,
    lowStockCount,
  ] = await Promise.all([
    getActiveItemCount(),
    getActiveWarehouseCount(),
    getActiveLocationCount(),
    getTotalInventoryQuantity(),
    getLowStockCount(),
  ]);

  return {
    activeItems,
    activeWarehouses,
    activeLocations,
    totalInventoryQty,
    lowStockCount,
  };
}
