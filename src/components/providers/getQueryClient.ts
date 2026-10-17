/**
 * getQueryClient.ts
 *
 * Request-scoped access to the React Query client from SERVER code.
 *
 * Why this exists: `QueryProvider` owns the client for the browser, but a Server
 * Component cannot reach into a React context. To seed the cache during SSR it
 * needs the same instance the provider will mount. On the server that instance
 * lives on `globalThis` for the duration of ONE request (`React.cache` gives us
 * that request scope), and it is never shared between requests — sharing would
 * leak one user's cached data into another user's render.
 *
 * The client is only used for its cache here: queries are never executed on the
 * server through `queryFn` from the browser bundle. A Server Component runs the
 * reader itself and pushes the result into the cache via `prefetchQuery`.
 */

import "server-only";

import { cache } from "react";
import { QueryClient } from "@tanstack/react-query";

declare global {
  // eslint-disable-next-line no-var
  var __inventoryQueryClient__: QueryClient | undefined;
}

/** Query defaults for SERVER-side prefetching: nothing should ever refetch here. */
function createServerQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Server renders are one-shot: a stale or absent entry is refetched by
        // the client's own provider, never by the server.
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        retry: false,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      mutations: { retry: 0 },
    },
  });
}

/**
 * Per-request QueryClient. Wrapped in `React.cache` so every Server Component in
 * the same render pass (layout, page, nested slots) shares one cache — that is
 * what makes a prefetch in a layout visible to the page that renders after it.
 */
export const getQueryClient = cache((): QueryClient => {
  // In dev, keep one client across HMR reloads so prefetched entries survive.
  if (process.env.NODE_ENV === "production") {
    return createServerQueryClient();
  }
  globalThis.__inventoryQueryClient__ ??= createServerQueryClient();
  return globalThis.__inventoryQueryClient__;
});
