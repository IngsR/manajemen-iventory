import React from "react";

/**
 * WorkspaceChromeSkeleton.tsx
 *
 * Fallback shown while the authenticated chrome (session read) streams in.
 *
 * It mirrors the geometry of `WorkspaceChrome` (dark 4rem header + 15rem
 * sidebar + content column) so pushing the session read behind a boundary does
 * not introduce a layout shift, and so a request-time render still *looks* like
 * an instantly-available shell.
 */
export function WorkspaceChromeSkeleton({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Header placeholder */}
      <header className="app-header sticky top-0 z-40 flex h-16 w-full items-center justify-between gap-3 px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-white/10 animate-pulse" />
          <div className="space-y-1.5">
            <div className="h-3 w-20 rounded bg-white/15 animate-pulse" />
            <div className="h-2 w-14 rounded bg-white/10 animate-pulse" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:block h-3 w-28 rounded bg-white/10 animate-pulse" />
          <div className="h-8 w-8 rounded-full bg-white/15 animate-pulse" />
        </div>
      </header>

      <div className="flex flex-1 min-h-[calc(100vh-4rem)]">
        {/* Sidebar placeholder (desktop only) */}
        <div className="app-sidebar hidden lg:flex w-60 flex-shrink-0 flex-col gap-3 px-3 py-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-9 rounded-xl bg-white/[0.06] animate-pulse"
            />
          ))}
        </div>

        <main className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
