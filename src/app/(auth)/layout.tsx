import { getCurrentUser } from "@/lib/Auth";
import { redirect } from "next/navigation";
import { RoleWorkspaceShell } from "@/components/navigation/RoleWorkspaceShell";

// Landing page per role — mirrors ROLE_HOME in src/actions/AuthActions.ts so an
// already-authenticated visitor never sits on the login form.
const ROLE_HOME: Record<string, string> = {
  ADMIN: "/dashboard/admin",
  SUPERVISOR: "/dashboard/supervisor",
  PETUGAS: "/dashboard/petugas",
};

// Authentication workspace layout (login, etc.).
// Renders the unauthenticated shell chrome (brand header + login CTA) for
// signed-out users, matching the previous global behaviour.
export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  // Already signed in: send the user straight to their role dashboard instead
  // of showing the credential form again.
  if (user) {
    redirect(ROLE_HOME[user.role] ?? "/");
  }

  return <RoleWorkspaceShell user={user}>{children}</RoleWorkspaceShell>;
}
