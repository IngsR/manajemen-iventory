import { requirePagePermission } from "@/lib/Auth";

// Master Data (Locations / zones & racks) management workspace.
// Server-side authorization boundary for the whole /locations segment.
// Only roles with LOCATION_UPDATE (ADMIN) may manage locations.
export default async function LocationsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requirePagePermission("LOCATION_UPDATE");
  return children;
}
