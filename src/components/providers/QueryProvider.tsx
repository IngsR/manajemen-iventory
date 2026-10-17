"use client";

import { SERVER_STALE_MS } from "@/lib/ServerState";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useState } from "react";

/** Sentinel id used as the top-level key for every server-state query. */
export const SERVER_STATE_KEY = "server-state" as const;

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Trust the server payload: it was produced during this same request.
        staleTime: SERVER_STALE_MS.master,
        gcTime: 30 * 60_000,
        refetchOnMount: false,
        refetchOnReconnect: false,
        retry: 1,
        structuralSharing: true,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

// One client per browser tab (module scope, so it survives HMR remounts of the
// provider subtree without throwing away the cache).
let browserQueryClient: QueryClient | undefined;

function getQueryClient(): QueryClient {
  if (typeof window === "undefined") {
    // Server render: a fresh client per request. Never share it across
    // requests — that would leak one user's cached data into another's render.
    return createQueryClient();
  }
  browserQueryClient ??= createQueryClient();
  return browserQueryClient;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // useState keeps a stable client across re-renders on the server too.
  const [client] = useState(getQueryClient);

  return (
    <QueryClientProvider client={client}>
      {children}
      {process.env.NODE_ENV === "development" && <DevtoolsLazy />}
    </QueryClientProvider>
  );
}

/**
 * Devtools are code-split so they never ship in a production bundle and never
 * block the first paint in development.
 */
function DevtoolsLazy() {
  const [Devtools, setDevtools] = useState<React.ComponentType<{
    initialIsOpen?: boolean;
  }> | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    import("@tanstack/react-query-devtools").then((mod) => {
      if (!cancelled) setDevtools(() => mod.ReactQueryDevtools);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!Devtools) return null;
  return <Devtools initialIsOpen={false} />;
}
