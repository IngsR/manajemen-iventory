import { getStaticCategories } from '@/lib/StaticData';
import { CategoriesClient } from './CategoriesClient';

/**
 * Master Kategori Barang.
 *
 * Hybrid rendering: the list is read from the cached static payload
 * (`getStaticCategories` -> `'use cache'` + tag `master:categories`), so the
 * page ships its rows with the static shell - no client-side fetch and no
 * loading flash. Authorization stays in the segment layout (server boundary)
 * and the interactive part is a client component seeded with the cached rows.
 *
 * Mutations still land in a Server Action which calls
 * `updateTag(StaticTags.CATEGORIES)`; the client then `router.refresh()`es and
 * this reader returns the fresh list.
 */
export default async function CategoriesPage() {
  const categories = await getStaticCategories();

  return <CategoriesClient initial={categories} />;
}
