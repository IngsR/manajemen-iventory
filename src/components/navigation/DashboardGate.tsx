import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/Auth";
import type { UserDoc, UserRole } from "@/models/UserModel";

/**
 * DashboardGate.tsx
 *
 * Shared streaming boundary for the role dashboards.
 *
 * Why: a dashboard page that does `await getCurrentUser()` at its top level
 * reads the session cookie and the user record *before* anything can paint, so
 * the whole route becomes request-bound and the shell cannot open instantly
 * (Next.js reports this as "uncached data during prerendering").
 *
 * Here the page keeps a synchronous, statically-renderable shell (header,
 * titles, action grid, terminal) and hands only the session-gated, live part to
 * this gate. The gate sits inside `<Suspense>`, so:
 *   - the shell is served from the static payload immediately,
 *   - the session is still verified server-side on every request,
 *   - a signed-out visitor gets a real redirect, and a wrong-role visitor is
 *     bounced to their own home instead of seeing protected content,
 *   - live numbers stream in a moment later without blocking the page.
 *
 * Authorization stays here (data layer), matching the existing per-page
 * convention (`requirePagePermission`). Usage:
 *
 *   <DashboardGate allow={["PETUGAS", "ADMIN"]} skeleton={<LiveSkeleton />}>
 *     <LiveMetrics />
 *   </DashboardGate>
 */

interface DashboardGateProps {
  /** Roles allowed to see the live content. Others are redirected to '/'. */
  allow: UserRole[];
  /** Static-safe placeholder shown while the session + data stream in. */
  skeleton: React.ReactNode;
  children: React.ReactNode;
}

async function GatedContent({
  allow,
  children,
}: Pick<DashboardGateProps, "allow" | "children">) {
  const user: UserDoc | null = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }
  if (!allow.includes(user.role)) {
    redirect("/");
  }

  return <>{children}</>;
}

export function DashboardGate({
  allow,
  skeleton,
  children,
}: DashboardGateProps) {
  return (
    <Suspense fallback={skeleton}>
      <GatedContent allow={allow}>{children}</GatedContent>
    </Suspense>
  );
}
