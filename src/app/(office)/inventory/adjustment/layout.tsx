import { requirePagePermission } from "@/lib/Auth";

// Manual stock adjustment — server-side authorization boundary.
// Requires ADJUSTMENT_CREATE; the adjustStockAction re-checks it independently.
export default async function AdjustmentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requirePagePermission("ADJUSTMENT_CREATE");
  return children;
}
