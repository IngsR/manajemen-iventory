import { requirePagePermission } from "@/lib/Auth";

// Master Data (Units of Measure) management workspace.
// Server-side authorization boundary for the whole /units segment.
// Only roles with UNIT_UPDATE (ADMIN) may manage units.
export default async function UnitsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requirePagePermission("UNIT_UPDATE");
  return children;
}
