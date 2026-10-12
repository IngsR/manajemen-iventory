import { requirePagePermission } from "@/lib/Auth";

// Master Data (Items) management workspace.
// This route-scoped layout enforces the server-side authorization boundary for
// the whole /items segment. Only roles with ITEM_UPDATE (ADMIN) may manage the
// item catalogue; other roles are redirected. Individual server actions still
// re-check ITEM_CREATE / ITEM_UPDATE independently.
export default async function ItemsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requirePagePermission("ITEM_UPDATE");
  return children;
}
