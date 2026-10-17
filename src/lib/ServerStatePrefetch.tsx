import "server-only";

import { getQueryClient } from "@/components/providers/getQueryClient";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { ServerStateSnapshot } from "./ServerStateKeys";

/**
 * A request-scoped React Query client plus the props that hydrate the browser
 * cache from it. Always call this INSIDE a Server Component (it reads request
 * context via `getQueryClient`).
 */
export async function createServerStateBoundary(): Promise<{
  queryClient: ReturnType<typeof getQueryClient>;
  boundary: { state: ServerStateSnapshot };
}> {
  const queryClient = getQueryClient();

  // `dehydrate` is synchronous; awaiting it would only add a microtask. The
  // snapshot happens here, so prefetch BEFORE calling this to have the payload
  // included — or render <ServerStateBoundary> so it dehydrates at render time.
  const state = dehydrate(queryClient) as ServerStateSnapshot;

  return { queryClient, boundary: { state } };
}

/**
 * Renders the boundary that hands a dehydrated cache to the client provider.
 * Kept as a separate component so a page can wrap only the subtree that needs
 * server-state (the rest of the route stays a pure RSC payload).
 */
export function ServerStateBoundary({
  state,
  children,
}: {
  state: ServerStateSnapshot;
  children: ReactNode;
}) {
  return (
    <HydrationBoundary state={state as never}>{children}</HydrationBoundary>
  );
}
