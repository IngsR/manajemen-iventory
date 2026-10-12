/**
 * StaticData.ts
 *
 * Data-access layer for the "static" half of the hybrid rendering strategy.
 *
 * Every reader below is wrapped in the `'use cache'` directive, which turns it
 * into a prerenderable cache entry:
 *
 *   - it is executed at BUILD time and included in the deployed static payload,
 *   - at runtime it is served straight from that cache (no MongoDB round-trip,
 *     no server memory spent re-rendering),
 *   - it is refreshed only when a matching cache tag is invalidated by a
 *     mutation, or when the `cacheLife` window expires.
 *
 * Cache tags are the contract between this file and the Server Actions that
 * mutate master data: an action calls `updateTag(StaticTags.CATEGORIES)` and the
 * next read is fresh (read-your-own-writes), while every other request keeps
 * being served from the static payload.
 *
 * IMPORTANT — serialization boundary: `'use cache'` arguments/returns must be
 * serializable (MongoDB `ObjectId` instances are NOT). Every doc returned here
 * is therefore normalized into a plain JSON structure with string ids.
 *
 * IMPORTANT — no runtime APIs: never call `cookies()` / `headers()` inside a
 * `'use cache'` scope. Authorization must happen OUTSIDE, in the page or in
 * `requirePagePermission` (see src/lib/Auth.ts).
 */

import { getCategoryCollection } from "@/models/CategoryModel";
import { getItemCollection, ItemDoc } from "@/models/ItemModel";
import { getLocationCollection } from "@/models/LocationModel";
import { getUnitCollection } from "@/models/UnitModel";
import { getWarehouseCollection } from "@/models/WarehouseModel";
import { cacheLife, cacheTag } from "next/cache";
import "server-only";

// ── Cache tags & lifetimes ───────────────────────────────────────────────────

/**
 * Tags used by master-data readers. Server Actions must invalidate the exact
 * tag of the collection they touched (via `updateTag`, or `revalidateTag` when
 * called outside a Server Action).
 */
export const StaticTags = {
  CATEGORIES: "master:categories",
  WAREHOUSES: "master:warehouses",
  LOCATIONS: "master:locations",
  UNITS: "master:units",
  ITEMS: "master:items",
} as const;

/**
 * Master data changes a handful of times per year, so `'days'`
 * (stale 5m / revalidate 1d / expire 1w) is used and mutation-driven
 * invalidation does the real work.
 */
const MASTER_LIFE = "days" as const;

// ── Serializable shapes ──────────────────────────────────────────────────────

export interface CategoryView {
  id: string;
  code: string;
  name: string;
  description?: string;
  status: "ACTIVE" | "INACTIVE";
}

export interface WarehouseView {
  id: string;
  code: string;
  name: string;
  address?: string;
  status: "ACTIVE" | "INACTIVE";
}

export interface LocationView {
  id: string;
  warehouseId: string;
  code: string;
  name: string;
  type: string;
  status: "ACTIVE" | "INACTIVE";
}

export interface UnitView {
  id: string;
  code: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
}

export interface ItemView {
  id: string;
  sku: string;
  name: string;
  categoryName: string;
  unitCode: string;
  minStock: number;
  status: "ACTIVE" | "INACTIVE";
}

// ── Master data readers (static / cached) ────────────────────────────────────

/** Active categories, sorted by name. Static until `StaticTags.CATEGORIES` is invalidated. */
export async function getStaticCategories(): Promise<CategoryView[]> {
  "use cache";
  cacheTag(StaticTags.CATEGORIES);
  cacheLife(MASTER_LIFE);

  const col = await getCategoryCollection();
  const docs = await col.find({ isDeleted: false }).sort({ name: 1 }).toArray();

  return docs.map((d) => ({
    id: d._id ? String(d._id) : "",
    code: d.code,
    name: d.name,
    description: d.description,
    status: d.status,
  }));
}

/** Warehouse facilities, sorted by code. */
export async function getStaticWarehouses(): Promise<WarehouseView[]> {
  "use cache";
  cacheTag(StaticTags.WAREHOUSES);
  cacheLife(MASTER_LIFE);

  const col = await getWarehouseCollection();
  const docs = await col.find({ isDeleted: false }).sort({ code: 1 }).toArray();

  return docs.map((d) => ({
    id: d._id ? String(d._id) : "",
    code: d.code,
    name: d.name,
    address: d.address,
    status: d.status,
  }));
}

/** Physical storage locations (zones / racks). */
export async function getStaticLocations(): Promise<LocationView[]> {
  "use cache";
  cacheTag(StaticTags.LOCATIONS);
  cacheLife(MASTER_LIFE);

  const col = await getLocationCollection();
  const docs = await col.find({ isDeleted: false }).sort({ code: 1 }).toArray();

  return docs.map((d) => ({
    id: d._id ? String(d._id) : "",
    warehouseId: String(d.warehouseId),
    code: d.code,
    name: d.name,
    type: d.type,
    status: d.status,
  }));
}

/** Units of measure. */
export async function getStaticUnits(): Promise<UnitView[]> {
  "use cache";
  cacheTag(StaticTags.UNITS);
  cacheLife(MASTER_LIFE);

  const col = await getUnitCollection();
  const docs = await col.find({ isDeleted: false }).sort({ code: 1 }).toArray();

  return docs.map((d) => ({
    id: d._id ? String(d._id) : "",
    code: d.code,
    name: d.name,
    status: d.status,
  }));
}

/**
 * Item catalogue enriched with its category name / unit code so it can be
 * rendered without any further lookup. Server Actions that touch items are
 * responsible for invalidating BOTH `StaticTags.ITEMS` and the category/unit
 * tags (a rename there changes the labels shown here).
 */
export async function getStaticItems(): Promise<ItemView[]> {
  "use cache";
  cacheTag(StaticTags.ITEMS, StaticTags.CATEGORIES, StaticTags.UNITS);
  cacheLife(MASTER_LIFE);

  const [itemCol, categoryCol, unitCol] = await Promise.all([
    getItemCollection(),
    getCategoryCollection(),
    getUnitCollection(),
  ]);

  const [items, categories, units] = await Promise.all([
    itemCol.find({ isDeleted: false }).sort({ sku: 1 }).toArray(),
    categoryCol.find({ isDeleted: false }).toArray(),
    unitCol.find({ isDeleted: false }).toArray(),
  ]);

  const categoryNames = new Map(categories.map((c) => [String(c._id), c.name]));
  const unitCodes = new Map(units.map((u) => [String(u._id), u.code]));

  return items.map((d: ItemDoc) => ({
    id: d._id ? String(d._id) : "",
    sku: d.sku,
    name: d.name,
    categoryName: categoryNames.get(String(d.categoryId)) ?? "-",
    unitCode: unitCodes.get(String(d.unitId)) ?? "-",
    minStock: d.minStock,
    status: d.status,
  }));
}

/**
 * Lightweight, serializable option lists for form `<select>` elements.
 * Used by operational forms (e.g. create stock opname) so their pickers can be
 * prerendered instead of fetched at request time.
 */
export async function getStaticWarehouseOptions(): Promise<
  { id: string; label: string }[]
> {
  const warehouses = await getStaticWarehouses();
  return warehouses
    .filter((w) => w.status === "ACTIVE")
    .map((w) => ({ id: w.id, label: `${w.name} (${w.code})` }));
}
