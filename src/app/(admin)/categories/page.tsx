import { getStaticCategories } from "@/lib/StaticData";
import { CategoriesClient } from "./CategoriesClient";

/**
 * Master Kategori Barang.
 *
 * Data is served from the `'use cache'` layer in `getStaticCategories` — it is
 * prerendered at build time (or after tag invalidation) and requires no
 * per-request DB round-trip. The result is passed directly as the `initial`
 * prop to `CategoriesClient`, which uses it as the starting value for the React
 * Query cache (`cached ?? initial`). No `QueryClient.prefetchQuery` is needed
 * here because there is nothing to hydrate: the client just reads `initial` on
 * first render and keeps it in sync via `router.refresh()` + `invalidate()`.
 */
export default async function CategoriesPage() {
  const categories = await getStaticCategories();

  return <CategoriesClient initial={categories} />;
}
