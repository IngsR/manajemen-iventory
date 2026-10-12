import { requirePagePermission } from "@/lib/Auth";

// Transfer (relocation) operation — server-side authorization boundary.
// Requires TRANSFER_CREATE; the transferStockAction re-checks it independently.
export default async function TransferLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requirePagePermission("TRANSFER_CREATE");
  return children;
}
