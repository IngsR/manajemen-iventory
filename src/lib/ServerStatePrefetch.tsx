import "server-only";

import { getQueryClient } from "@/components/providers/getQueryClient";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { QueryClient } from "@tanstack/react-query";

/**
 * Returns a request-scoped React Query client. Always call this INSIDE a
 * Server Component (it reads request context via `getQueryClient`).
 *
 * Pass the returned `queryClient` to `ServerStateBoundary` so that
 * dehydration happens AFTER all `prefetchQuery` calls have completed.
 */
export function createServerStateBoundary(): {
  queryClient: ReturnType<typeof getQueryClient>;
} {
  const queryClient = getQueryClient();
  return { queryClient };
}

/**
 * Renders the boundary that hands a dehydrated cache to the client provider.
 * Dehydration happens at render time so all prior `prefetchQuery` calls are
 * included in the snapshot.
 */
export function ServerStateBoundary({
  queryClient,
  children,
}: {
  queryClient: QueryClient;
  children: ReactNode;
}) {
  const state = dehydrate(queryClient);
  return (
    <HydrationBoundary state={state as never}>{children}</HydrationBoundary>
  );
}
