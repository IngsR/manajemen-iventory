import { requirePagePermission } from "@/lib/Auth";

// Issue (outbound) operation — server-side authorization boundary.
// Requires ISSUE_CREATE; the issueStockAction re-checks it independently.
export default async function IssueLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requirePagePermission("ISSUE_CREATE");
  return children;
}
