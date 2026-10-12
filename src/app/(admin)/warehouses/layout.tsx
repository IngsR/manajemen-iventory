import { requirePagePermission } from "@/lib/Auth";

// Master Data (Warehouses / facilities) management workspace.
// Server-side authorization boundary for the whole /warehouses segment.
// Only roles with WAREHOUSE_UPDATE (ADMIN) may manage warehouses.
export default async function WarehousesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requirePagePermission("WAREHOUSE_UPDATE");
  return children;
}
