import { AuthShell } from "@/components/navigation/AuthShell";

// ADMIN workspace layout.
//
// Route Groups only organize routes and provide the workspace shell/UI. They
// are NOT an authorization mechanism — a folder name is never a permission
// boundary. The correct navbar is selected inside RoleWorkspaceShell from the
// authenticated user's role.
//
// Authorization is enforced per page/action via requirePagePermission /
// requirePermission / hasPermission (src/lib/Auth.ts).
//
// Only authentication (must be logged in) is required to render this shell.
//
// Hybrid rendering: this layout is deliberately NOT `async` and never reads the
// session at its top level — that would make the whole segment request-bound.
// The shell (header/sidebar) prerenders into the static shell and opens
// instantly, while AuthShell verifies the session and streams the
// user-dependent chrome inside a Suspense boundary.
export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AuthShell>{children}</AuthShell>;
}
