/** Namespace prefix for every server-state entry. */
export const SERVER_STATE_KEY = "server-state" as const;

/** Root key: pass to `invalidateQueries` to drop the whole server-state cache. */
export const SERVER_STATE_ROOT_KEY: readonly [typeof SERVER_STATE_KEY] = [
  SERVER_STATE_KEY,
] as const;

/** Primitive argument type accepted by a key builder. */
export type ServerStateKeyValue = string | number | boolean | null | undefined;

/** A fully-built key (always starts with the namespace prefix). */
export type ServerStateKey = readonly [
  typeof SERVER_STATE_KEY,
  ServerStateKeyName,
  ...ServerStateKeyValue[],
];

/**
 * The dehydrated payload contract for `ServerStateBoundary`.
 *
 * React Query's `dehydrate()` returns a branded `DehydratedState` whose brand is
 * module-private to the `@tanstack/react-query` build. Re-declaring the brand
 * here would only work if the module instance identity matched exactly, so the
 * boundary accepts the structural shape and leaves the brand to the source.
 */
export interface ServerStateSnapshot {
  mutations: unknown[];
  queries: unknown[];
}

/** Every server-state key name, derived from the registry below. */
export type ServerStateKeyName = keyof typeof serverStateKeys;

/** Alias kept for readability at call sites that build query options. */
export type ServerStateQueryKey = ServerStateKey;

/**
 * Normalises an optional argument so that "no argument" and "undefined"
 * produce the SAME key (otherwise the server would seed `[.., "x", undefined]`
 * while the client looks up `[.., "x"]` and misses the cache).
 */
function arg(value: ServerStateKeyValue): ServerStateKeyValue[] {
  return value === undefined ? [] : [value];
}

export const serverStateKeys = {
  // ── Dashboard slices (mirrors src/services/reporting/DashboardService.ts) ──
  "dashboard:counts": () => [SERVER_STATE_KEY, "dashboard:counts"] as const,
  "dashboard:low-stock": (limit: number) =>
    [SERVER_STATE_KEY, "dashboard:low-stock", limit] as const,
  "dashboard:recent-movements": (limit: number) =>
    [SERVER_STATE_KEY, "dashboard:recent-movements", limit] as const,
  "dashboard:opname-summary": () =>
    [SERVER_STATE_KEY, "dashboard:opname-summary"] as const,
  "dashboard:movement-summary": () =>
    [SERVER_STATE_KEY, "dashboard:movement-summary"] as const,
  /** Pending-opname approval queue for the supervisor desk. */
  "dashboard:pending-approvals": (pageSize: number) =>
    [SERVER_STATE_KEY, "dashboard:pending-approvals", pageSize] as const,

  // ── Master data (mirrors src/lib/StaticData.ts cached readers) ─────────────
  "master:categories": () => [SERVER_STATE_KEY, "master:categories"] as const,
  "master:warehouses": () => [SERVER_STATE_KEY, "master:warehouses"] as const,
  "master:locations": () => [SERVER_STATE_KEY, "master:locations"] as const,
  "master:units": () => [SERVER_STATE_KEY, "master:units"] as const,
  "master:items": () => [SERVER_STATE_KEY, "master:items"] as const,

  // ── Stock opname documents (live, request-time) ───────────────────────────
  "opname:list": (status?: string | null) =>
    [SERVER_STATE_KEY, "opname:list", ...arg(status ?? undefined)] as const,
  "opname:detail": (id: string) =>
    [SERVER_STATE_KEY, "opname:detail", id] as const,

  // ── Reports & audit ──────────────────────────────────────────────────────
  "report:movements": (filters: {
    page?: number;
    type?: string | null;
    sku?: string | null;
    actor?: string | null;
    warehouseId?: string | null;
    locationId?: string | null;
  }) =>
    [
      SERVER_STATE_KEY,
      "report:movements",
      filters.page ?? 1,
      filters.type ?? null,
      filters.sku ?? null,
      filters.actor ?? null,
      filters.warehouseId ?? null,
      filters.locationId ?? null,
    ] as const,
  "report:opnames": (filters: {
    page?: number;
    status?: string | null;
    warehouseId?: string | null;
  }) =>
    [
      SERVER_STATE_KEY,
      "report:opnames",
      filters.page ?? 1,
      filters.status ?? null,
      filters.warehouseId ?? null,
    ] as const,
  "report:low-stock": (limit: number) =>
    [SERVER_STATE_KEY, "report:low-stock", limit] as const,
  "audit:recent": (limit: number) =>
    [SERVER_STATE_KEY, "audit:recent", limit] as const,
} as const;
