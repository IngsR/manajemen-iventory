"use client";

/**
 * dashboardStore.ts
 *
 * Client-side Zustand store for dashboard metrics.
 *
 * Design goals (KISS):
 *  1. Render the dashboard from server-fetched data instantly (no loading
 *     flash) by seeding the store with the RSC payload.
 *  2. Support *prioritized* client-side refreshes: critical slices (metric
 *     cards) are re-fetched first, then secondary panels (activity feeds).
 *  3. De-duplicate in-flight requests and keep a short freshness window so
 *     rapid remounts / tab switches don't hammer the API.
 *
 * The store holds no business logic — the API route does the querying. The
 * store only owns cache freshness, request state and prioritization.
 */

import { create } from "zustand";

// ── Types (mirrors src/services/reporting/DashboardService.ts) ────────────────

export interface DashboardCounts {
  activeItems: number;
  activeWarehouses: number;
  activeLocations: number;
  totalInventoryQty: number;
  lowStockCount: number;
}

export interface MovementSummaryItem {
  type: string;
  count: number;
  totalQuantity: number;
}

export interface OpnameSummaryItem {
  status: string;
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
  type: string;
  sku: string;
  quantity: number;
  timestamp: string;
  actorName: string;
}

export type DashboardRole = "ADMIN" | "PETUGAS" | "SUPERVISOR";

export interface DashboardData {
  counts: DashboardCounts;
  lowStockItems: LowStockItem[];
  recentMovements: RecentMovement[];
  opnameSummary: OpnameSummaryItem[];
  movementSummary: MovementSummaryItem[];
}

// ── Freshness windows ────────────────────────────────────────────────────────

/** Slices considered "critical": shown above the fold. */
export const PRIORITY_CRITICAL: DashboardSlice[] = ["counts"];
/** Slices considered "secondary": rendered after the critical ones. */
export const PRIORITY_SECONDARY: DashboardSlice[] = [
  "lowStockItems",
  "recentMovements",
  "opnameSummary",
  "movementSummary",
];

export type DashboardSlice = keyof DashboardData;

const FRESHNESS_MS: Record<DashboardSlice, number> = {
  counts: 60_000,
  lowStockItems: 60_000,
  opnameSummary: 60_000,
  recentMovements: 20_000,
  movementSummary: 60_000,
};

export const DEFAULT_DASHBOARD_DATA: DashboardData = {
  counts: {
    activeItems: 0,
    activeWarehouses: 0,
    activeLocations: 0,
    totalInventoryQty: 0,
    lowStockCount: 0,
  },
  lowStockItems: [],
  recentMovements: [],
  opnameSummary: [],
  movementSummary: [],
};

interface DashboardState {
  data: DashboardData;
  /** Keys currently being fetched, so UI can show per-slice spinners. */
  loading: Record<string, boolean>;
  lastFetched: Partial<Record<DashboardSlice, number>>;
  error: string | null;
  /** Slice keys fetched at least once during this session. */
  hydrated: Record<string, boolean>;

  /** Seed the store from a server component render (instant paint). */
  hydrate: (payload: DashboardData, fetchedAt?: number) => void;
  /** Fetch a set of slices, most important first. */
  refresh: (options?: {
    role?: DashboardRole;
    slices?: DashboardSlice[];
    force?: boolean;
  }) => Promise<void>;
}

/**
 * Slices that are actually needed per role — keeps the API payload and the
 * number of DB round-trips proportional to what the page renders.
 */
const ROLE_SLICES: Record<DashboardRole, DashboardSlice[]> = {
  ADMIN: [
    "counts",
    "lowStockItems",
    "recentMovements",
    "opnameSummary",
    "movementSummary",
  ],
  SUPERVISOR: ["counts", "lowStockItems", "recentMovements", "opnameSummary"],
  PETUGAS: ["counts", "recentMovements"],
};

// In-flight request de-duplication (module scope, outside React).
let inflight: Promise<void> | null = null;

function sliceKey(slices: DashboardSlice[]): string {
  return [...slices].sort().join(",");
}

function sortByPriority(slices: DashboardSlice[]): DashboardSlice[] {
  const order = [...PRIORITY_CRITICAL, ...PRIORITY_SECONDARY];
  return [...slices].sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  data: DEFAULT_DASHBOARD_DATA,
  loading: {},
  lastFetched: {},
  error: null,
  hydrated: {},

  hydrate: (payload, fetchedAt = Date.now()) =>
    set((state) => ({
      data: payload,
      lastFetched: Object.fromEntries(
        (Object.keys(payload) as DashboardSlice[]).map((s) => [s, fetchedAt]),
      ),
      hydrated: Object.fromEntries(
        (Object.keys(payload) as DashboardSlice[]).map((s) => [s, true]),
      ),
      error: null,
    })),

  refresh: async ({ role = "ADMIN", slices, force = false } = {}) => {
    const requested = slices ?? ROLE_SLICES[role];

    // Split into what still needs fetching vs. what is still fresh.
    const now = Date.now();
    const { lastFetched } = get();
    const stale = requested.filter(
      (s) =>
        force ||
        !lastFetched[s] ||
        now - (lastFetched[s] as number) > FRESHNESS_MS[s],
    );
    if (stale.length === 0) return;

    const ordered = sortByPriority(stale);
    const key = sliceKey(ordered);

    // If an identical request is already running, just wait for it.
    if (inflight) return inflight;

    set({
      loading: Object.fromEntries(ordered.map((s) => [s, true])),
      error: null,
    });

    inflight = (async () => {
      try {
        const res = await fetch(
          `/api/dashboard?role=${role}&slices=${ordered.join(",")}`,
          {
            cache: "no-store",
          },
        );
        if (!res.ok)
          throw new Error(`Dashboard request failed (${res.status})`);
        const json = (await res.json()) as {
          data: Partial<DashboardData>;
          fetchedAt: number;
        };

        set((state) => ({
          data: { ...state.data, ...json.data },
          lastFetched: {
            ...state.lastFetched,
            ...Object.fromEntries(
              Object.keys(json.data).map((s) => [s, json.fetchedAt]),
            ),
          },
          hydrated: {
            ...state.hydrated,
            ...Object.fromEntries(Object.keys(json.data).map((s) => [s, true])),
          },
          loading: {},
          error: null,
        }));
      } catch (err) {
        set({
          loading: {},
          error:
            err instanceof Error ? err.message : "Gagal memuat data dashboard",
        });
      } finally {
        inflight = null;
      }
    })();

    return inflight;
  },
}));

/** Selector helpers keep component re-renders narrow. */
export const selectCounts = (s: DashboardState) => s.data.counts;
export const selectLowStock = (s: DashboardState) => s.data.lowStockItems;
export const selectRecentMovements = (s: DashboardState) =>
  s.data.recentMovements;
export const selectOpnameSummary = (s: DashboardState) => s.data.opnameSummary;
export const selectMovementSummary = (s: DashboardState) =>
  s.data.movementSummary;
