/**
 * Cache.ts
 *
 * Tiny in-process TTL cache used to de-duplicate expensive read-only queries
 * (dashboard aggregations, report counts, ...) across concurrent requests and
 * rapid navigation.
 *
 * Kept intentionally minimal (KISS):
 *  - One module-level Map keyed by a string.
 *  - Entries store the resolved value + an expiry timestamp.
 *  - Concurrent callers of the same key share the same in-flight Promise, so
 *    "N parallel requests" only ever hit MongoDB once.
 *
 * This is NOT a distributed cache. In multi-instance deployments each instance
 * keeps its own copy, which is fine for short TTLs on read-only aggregates.
 */

interface CacheEntry<T> {
    value?: T;
    expiresAt: number;
    pending?: Promise<T>;
}

const store = new Map<string, CacheEntry<unknown>>();

/**
 * Returns a cached value for `key`, or computes it via `factory` and caches the
 * result for `ttlMs`. Concurrent calls for the same key await the same promise.
 */
export async function cached<T>(
    key: string,
    ttlMs: number,
    factory: () => Promise<T>
): Promise<T> {
    const now = Date.now();
    const hit = store.get(key) as CacheEntry<T> | undefined;

    if (hit) {
        if (hit.pending) return hit.pending;
        if (hit.expiresAt > now) return hit.value as T;
    }

    const pending = factory()
        .then((value) => {
            store.set(key, { value, expiresAt: Date.now() + ttlMs });
            return value;
        })
        .catch((err) => {
            // Never cache failures — let the next call retry.
            store.delete(key);
            throw err;
        });

    store.set(key, { expiresAt: now + ttlMs, pending });
    return pending;
}

/** Drop a single cached key (e.g. after a mutation invalidates a metric). */
export function invalidate(key: string): void {
    store.delete(key);
}

/** Drop every cached key (used by seeds / tests). */
export function invalidateAll(): void {
    store.clear();
}

/** TTL presets so callers stay consistent. */
export const CacheTTL = {
    /** Master-data counts — rarely change. */
    MASTER_DATA: 5 * 60_000,
    /** Aggregates over the inventory ledger — change on every transaction. */
    LEDGER: 30_000,
    /** Fast-changing "recent activity" feeds. */
    RECENT: 15_000,
} as const;
