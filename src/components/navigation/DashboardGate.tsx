import { getCurrentUser } from "@/lib/Auth";
import type { UserDoc, UserRole } from "@/models/UserModel";
import { redirect } from "next/navigation";
import React, { Suspense } from "react";

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
