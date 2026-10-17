"use client";

import {
  SERVER_STATE_ROOT_KEY,
  serverStateKeys,
  type ServerStateKeyValue,
} from "@/lib/ServerStateKeys";
// `@/lib/ServerStateKeys` is intentionally free of `server-only`, so the client
// can read the SAME staleness constants the Server Components use. Importing the
// numbers from `@/lib/ServerState` would drag in `server-only` and break the
// build; keeping a second copy here would let the two drift and turn a warm
// hydrated payload into a pointless refetch.
import type { QueryKey } from "@tanstack/react-query";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";

// Re-exported so components only ever import the key registry from here.
export { SERVER_STATE_ROOT_KEY, serverStateKeys };
export type { ServerStateKeyValue };

// ── Tuned per data class ─────────────────────────────────────────────────────
//
// These mirror `SERVER_STALE_MS` in src/lib/ServerState.ts, which cannot be
// imported here because that module is `server-only`. Keep both sides in sync:
// a client `staleTime` below its server TTL makes React Query discard a payload
// the server just rendered and re-request identical data.

const MASTER_STALE_MS = 5 * 60_000;
const LEDGER_STALE_MS = 30_000;
const RECENT_STALE_MS = 15_000;
const REPORT_STALE_MS = 60_000;
const AUDIT_STALE_MS = 30_000;

/** How long a server-state entry stays in memory after its last consumer unmounts. */
const GC_MS = 30 * 60_000;

// ── Dashboard slices ─────────────────────────────────────────────────────────

export function useDashboardCounts<T>() {
  return useServerStateQuery<T>(
    serverStateKeys["dashboard:counts"](),
    LEDGER_STALE_MS,
  );
}

export function useLowStockItems<T>(limit: number) {
  return useServerStateQuery<T>(
    serverStateKeys["dashboard:low-stock"](limit),
    LEDGER_STALE_MS,
  );
}

export function useRecentMovements<T>(limit: number) {
  return useServerStateQuery<T>(
    serverStateKeys["dashboard:recent-movements"](limit),
    RECENT_STALE_MS,
  );
}

export function useOpnameSummary<T>() {
  return useServerStateQuery<T>(
    serverStateKeys["dashboard:opname-summary"](),
    LEDGER_STALE_MS,
  );
}

export function useMovementSummary<T>() {
  return useServerStateQuery<T>(
    serverStateKeys["dashboard:movement-summary"](),
    LEDGER_STALE_MS,
  );
}

export function usePendingApprovals<T>(pageSize: number) {
  return useServerStateQuery<T>(
    serverStateKeys["dashboard:pending-approvals"](pageSize),
    LEDGER_STALE_MS,
  );
}

// ── Master data ──────────────────────────────────────────────────────────────

export function useCategories<T>() {
  return useServerStateQuery<T>(
    serverStateKeys["master:categories"](),
    MASTER_STALE_MS,
  );
}

export function useWarehouses<T>() {
  return useServerStateQuery<T>(
    serverStateKeys["master:warehouses"](),
    MASTER_STALE_MS,
  );
}

export function useLocations<T>() {
  return useServerStateQuery<T>(
    serverStateKeys["master:locations"](),
    MASTER_STALE_MS,
  );
}

export function useUnits<T>() {
  return useServerStateQuery<T>(
    serverStateKeys["master:units"](),
    MASTER_STALE_MS,
  );
}

export function useItems<T>() {
  return useServerStateQuery<T>(
    serverStateKeys["master:items"](),
    MASTER_STALE_MS,
  );
}

// ── Stock opname documents ───────────────────────────────────────────────────

export function useOpnameList<T>(status?: string | null) {
  return useServerStateQuery<T>(
    serverStateKeys["opname:list"](status ?? undefined),
    REPORT_STALE_MS,
  );
}

export function useOpnameDetail<T>(id: string) {
  return useServerStateQuery<T>(
    serverStateKeys["opname:detail"](id),
    REPORT_STALE_MS,
  );
}

// ── Reports & audit ──────────────────────────────────────────────────────────

export function useMovementReport<T>(filters: {
  page?: number;
  type?: string | null;
  sku?: string | null;
  actor?: string | null;
  warehouseId?: string | null;
  locationId?: string | null;
}) {
  return useServerStateQuery<T>(
    serverStateKeys["report:movements"](filters),
    REPORT_STALE_MS,
  );
}

export function useOpnameReport<T>(filters: {
  page?: number;
  status?: string | null;
  warehouseId?: string | null;
}) {
  return useServerStateQuery<T>(
    serverStateKeys["report:opnames"](filters),
    REPORT_STALE_MS,
  );
}

export function useLowStockReport<T>(limit: number) {
  return useServerStateQuery<T>(
    serverStateKeys["report:low-stock"](limit),
    REPORT_STALE_MS,
  );
}

export function useRecentAuditLogs<T>(limit: number) {
  return useServerStateQuery<T>(
    serverStateKeys["audit:recent"](limit),
    AUDIT_STALE_MS,
  );
}

// ── Generic accessors ────────────────────────────────────────────────────────

/**
 * Reads a server-state entry. The payload is ALWAYS present on a server-rendered
 * route (the Server Component seeded it), so `data` is never `undefined` there.
 * It can be `undefined` only when a component mounts a key that no server
 * prefetch covers — a programming error the `throwOnMissingData` flag surfaces.
 */
export function useServerStateQuery<T>(
  key: QueryKey,
  staleTime: number,
  options?: { enabled?: boolean },
): UseQueryResult<T> {
  return useQuery<T>({
    queryKey: key,
    // The data is pushed in from the server; there is nothing to fetch.
    queryFn: () => {
      throw new Error(
        `Server-state key [${key.join(", ")}] has no cached payload. ` +
          `Prefetch it in the Server Component with getQueryClient().prefetchQuery().`,
      );
    },
    staleTime,
    gcTime: GC_MS,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    enabled: options?.enabled ?? true,
  });
}

/** Imperatively read a server-state payload outside of a hook (event handlers). */
export function useServerStateGetter() {
  const client = useQueryClient();
  return <T>(key: QueryKey): T | undefined => client.getQueryData<T>(key);
}

// ── Invalidation (the only client-driven network work) ───────────────────────

/**
 * Marks server-state entries dirty. React Query's `invalidateQueries` on an
 * inactive/never-fetched key just marks it stale — no request is issued — and the
 * `router.refresh()` that follows re-renders the Server Component, whose fresh
 * payload lands in exactly this key.
 *
 * Pass nothing to invalidate the whole server-state namespace.
 */
export function useInvalidateServerState() {
  const client = useQueryClient();
  return (...keys: QueryKey[]) => {
    const targets = keys.length > 0 ? keys : [SERVER_STATE_ROOT_KEY];
    for (const queryKey of targets) {
      void client.invalidateQueries({ queryKey, refetchType: "none" });
    }
  };
}

/**
 * Wraps a Server Action so callers get React Query's mutation lifecycle
 * (`isPending`, `error`) without re-implementing it per form. The action stays
 * the source of truth for validation/authorization; this only tracks state.
 */
export function useServerAction<TVariables, TResult>(
  action: (variables: TVariables) => Promise<TResult>,
  options?: {
    /** Server-state keys to invalidate after the action reports success. */
    invalidate?: (variables: TVariables, result: TResult) => QueryKey[];
  },
): UseMutationResult<TResult, Error, TVariables> {
  const invalidate = useInvalidateServerState();

  return useMutation<TResult, Error, TVariables>({
    mutationFn: action,
    onSuccess: (result, variables) => {
      if (options?.invalidate) {
        invalidate(...options.invalidate(variables, result));
      }
    },
  });
}

/** Convenience: pre-built key for a master-data collection. */
export function masterKey(
  name: "categories" | "warehouses" | "locations" | "units" | "items",
): QueryKey {
  const builder = {
    categories: serverStateKeys["master:categories"],
    warehouses: serverStateKeys["master:warehouses"],
    locations: serverStateKeys["master:locations"],
    units: serverStateKeys["master:units"],
    items: serverStateKeys["master:items"],
  }[name];
  return builder();
}
