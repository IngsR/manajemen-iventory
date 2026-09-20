import { requirePagePermission } from "@/lib/Auth";

// Stock Opname workspace — shared by PETUGAS (create/submit) and SUPERVISOR
// (view/approve/reject). Server-side authorization boundary for the whole
// /inventory/stock-opname segment: requires STOCK_OPNAME_VIEW.
// The individual server actions re-check STOCK_OPNAME_CREATE / _SUBMIT /
// _APPROVE / _REJECT independently.
export default async function StockOpnameLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requirePagePermission("STOCK_OPNAME_VIEW");
  return children;
}
