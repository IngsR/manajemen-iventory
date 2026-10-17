/**
 * ServerState.ts
 *
 * The single contract between the SERVER render and the React Query cache.
 *
 * Architecture in one paragraph:
 *
 *   Every read path in this app runs on the server (Server Components call the
 *   `src/services/*` readers directly and are authorized by
 *   `requirePagePermission`). The resulting payload is serialized into the RSC
 *   stream and handed to `<HydrationBoundary>`; React Query picks it up as a
 *   warm cache entry, so the client renders real data on the very first paint —
 *   no `useEffect` fetch, no spinner, no request waterfall. Mutations still run
 *   through Server Actions; on success the action's `updateTag()` invalidates
 *   the server cache AND the component calls `invalidateQueries`, so the next
 *   server render (triggered by `router.refresh()`) streams the fresh rows into
 *   the same cache key.
 *
 * Rules this file exists to enforce:
 *
 *   1. ONE place defines query keys. A typo in a key is a silent cache miss, so
 *      keys are built only through `serverStateKeys`.
 *   2. ONE place defines staleness. `staleTime` must be >= the server-side TTL
 *      (`CacheTTL` in src/lib/Cache.ts) for the same data, otherwise the browser
 *      would consider a just-hydrated payload stale and immediately re-request
 *      what the server already sent.
 *   3. ONE place defines refetch policy. `refetchOnWindowFocus` is enabled only
 *      for live ledger data; master data changes rarely and is driven by
 *      explicit invalidation instead.
 *
 * `src/lib/ServerStateKeys.ts` holds the key registry itself and stays free of
 * `server-only` imports so client components can import it safely.
 */

import "server-only";

export {
  SERVER_STATE_KEY,
  SERVER_STATE_ROOT_KEY,
  serverStateKeys,
  type ServerStateKey,
  type ServerStateKeyName,
  type ServerStateKeyValue,
  type ServerStateQueryKey,
} from "./ServerStateKeys";

import {
  serverStateKeys,
  type ServerStateKey,
  type ServerStateKeyName,
  type ServerStateKeyValue,
  type ServerStateQueryKey,
} from "./ServerStateKeys";

// ── Staleness ────────────────────────────────────────────────────────────────

/**
 * Client-side `staleTime` per data class, in milliseconds. These mirror the
 * server TTLs in `@/lib/Cache` so the hydrated payload is never treated as
 * stale on mount, while a long-lived tab still refreshes on its own.
 */
export const SERVER_STALE_MS = {
  /** Master data (categories, warehouses, locations, units, items). */
  master: 5 * 60_000,
  /** Ledger aggregates that change on every transaction. */
  ledger: 30_000,
  /** Fast-moving "recent activity" feeds. */
  recent: 15_000,
  /** Reports and document lists — expensive, invalidated on mutation. */
  report: 60_000,
  /** Append-only audit trail. */
  audit: 30_000,
} as const;

/** Data classes, keyed by the `staleTime` bucket each key name belongs to. */
export type ServerStateDataClass = keyof typeof SERVER_STALE_MS;

/**
 * Which staleness bucket every key name belongs to. Declared as a complete
 * record so adding a key name without classifying it is a compile error rather
 * than a silently mis-tuned cache entry.
 */
const DATA_CLASS_BY_KEY_NAME: Record<ServerStateKeyName, ServerStateDataClass> =
  {
    "dashboard:counts": "ledger",
    "dashboard:low-stock": "ledger",
    "dashboard:recent-movements": "recent",
    "dashboard:opname-summary": "ledger",
    "dashboard:movement-summary": "ledger",
    "dashboard:pending-approvals": "ledger",

    "master:categories": "master",
    "master:warehouses": "master",
    "master:locations": "master",
    "master:units": "master",
    "master:items": "master",

    "opname:list": "report",
    "opname:detail": "report",

    "report:movements": "report",
    "report:opnames": "report",
    "report:low-stock": "report",
    "audit:recent": "audit",
  };

/**
 * Resolves a key name + argument to the React Query key and its matching
 * `staleTime`. Always derive keys through this helper so the server prefetch and
 * the client hook can never drift apart.
 */
export interface ServerStateQueryOptions {
  queryKey: ServerStateQueryKey;
  staleTime: number;
}

/**
 * Resolves a key name + argument to the React Query key and its matching
 * `staleTime`. Always derive keys through this helper so the server prefetch and
 * the client hook can never drift apart.
 *
 * The return value is directly spreadable into `useQuery` / `prefetchQuery`:
 * `{ ...serverStateQueryKey("master:categories") }`.
 */
export function serverStateQueryKey(
  name: ServerStateKeyName,
  value?: ServerStateKeyValue,
): ServerStateQueryOptions {
  const queryKey = serverStateKeys[name](value as never) as ServerStateKey;
  return { queryKey, staleTime: SERVER_STALE_MS[DATA_CLASS_BY_KEY_NAME[name]] };
}

/** Shorthand: just the key (used when the caller already has the staleTime). */
export function serverStateKeyOf(
  name: ServerStateKeyName,
  value?: ServerStateKeyValue,
): ServerStateKey {
  return serverStateKeys[name](value as never) as ServerStateKey;
}
