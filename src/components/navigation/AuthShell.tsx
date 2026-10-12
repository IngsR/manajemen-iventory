import { getCurrentUser } from "@/lib/Auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import React, { Suspense } from "react";
import { RoleWorkspaceShell } from "./RoleWorkspaceShell";
import { WorkspaceChromeSkeleton } from "./WorkspaceChromeSkeleton";

/**
 * AuthShell.tsx
 *
 * The boundary that keeps the application shell (header + sidebar/topbar) part
 * of the STATIC shell instead of a per-request render.
 *
 * Why it exists: the previous layouts did `await getCurrentUser()` at the top
 * level, which reads the session cookie and therefore opted the whole segment
 * into request-time rendering — every navigation re-rendered the entire chrome
 * on the server.
 *
 * Here the chrome is a plain (prerenderable) server component and ONLY the
 * session read + the parts of the chrome that depend on the signed-in user
 * (name, e-mail, role badge, logout button) sit behind `<Suspense>`. Consequences:
 *
 *   - the sidebar/topbar/layout structure is served from the static prerender
 *     immediately (no server memory per request, instant paint),
 *   - the session is still verified on every request, server-side, before any
 *     protected content is sent (the children are only reachable through this
 *     boundary — see the Next.js guidance that auth is a data-layer concern,
 *     https://nextjs.org/docs/app/guides/authentication),
 *   - a signed-out visitor is bounced to /login with a real HTTP 307.
 *
 * Authorization (role → permission) intentionally stays out of layouts: it is
 * enforced per page/action via requirePagePermission / requirePermission.
 *
 * NOTE — why the `redirect()` call is wrapped in `beginSessionBoundary()`:
 * reading a dynamic API (`cookies()` / `headers()`) opts this segment into
 * request-time rendering, so the framework can answer the signed-out case with a
 * real HTTP 307 BEFORE the static shell is flushed. That is what keeps the
 * previous security behaviour (never answer a protected URL with 200 + chrome).
 * The primary call site is `getCurrentUser()` itself, which reads the session
 * cookie; `beginSessionBoundary()` simply makes the dependency explicit and
 * documents the intent at the point where the redirect is issued.
 */

/**
 * Marks the session boundary. `headers()` is a dynamic API: awaiting it opts the
 * boundary into the request-time render pass so `redirect()` below can still
 * produce an HTTP 307 response header (rather than a client-side redirect after
 * a 200). It carries no user data — it is a marker, not a read.
 */
async function beginSessionBoundary(): Promise<void> {
  try {
    await headers();
  } catch {
    // Outside a request/streaming context there is nothing to opt into.
  }
}

interface AuthShellProps {
  children: React.ReactNode;
}

/** Request-time part: reads the session, redirects if absent, renders the personalised chrome. */
async function AuthenticatedChrome({ children }: AuthShellProps) {
  // Opt into the request-time pass so a missing session yields a real 307.
  await beginSessionBoundary();

  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return <RoleWorkspaceShell user={user}>{children}</RoleWorkspaceShell>;
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <Suspense
      fallback={<WorkspaceChromeSkeleton>{null}</WorkspaceChromeSkeleton>}
    >
      <AuthenticatedChrome>{children}</AuthenticatedChrome>
    </Suspense>
  );
}
