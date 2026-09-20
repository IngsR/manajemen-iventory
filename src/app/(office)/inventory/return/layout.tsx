import { requirePagePermission } from "@/lib/Auth";

// Return operation — server-side authorization boundary.
// Requires RETURN_CREATE; the returnStockAction re-checks it independently.
export default async function ReturnLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requirePagePermission("RETURN_CREATE");
  return children;
}
