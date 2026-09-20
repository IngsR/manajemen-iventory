import { RoleWorkspaceShell } from "@/components/navigation/RoleWorkspaceShell";
import { getCurrentUser } from "@/lib/Auth";
import { redirect } from "next/navigation";

// OFFICER / PETUGAS operational workspace layout.
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
export default async function OfficerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return <RoleWorkspaceShell user={user}>{children}</RoleWorkspaceShell>;
}
