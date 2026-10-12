import { requirePagePermission } from "@/lib/Auth";

// Receive (inbound) operation — server-side authorization boundary.
// Requires RECEIVE_CREATE; the receiveStockAction re-checks it independently.
export default async function ReceiveLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requirePagePermission("RECEIVE_CREATE");
  return children;
}
