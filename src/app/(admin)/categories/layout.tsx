import { requirePagePermission } from "@/lib/Auth";

// Master Data (Categories) management workspace.
// Server-side authorization boundary for the whole /categories segment.
// Only roles with CATEGORY_UPDATE (ADMIN) may manage categories.
export default async function CategoriesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requirePagePermission("CATEGORY_UPDATE");
  return children;
}
