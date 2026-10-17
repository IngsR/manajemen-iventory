import { getStaticCategories } from "@/lib/StaticData";
import { serverStateKeys } from "@/lib/ServerStateKeys";
import {
  createServerStateBoundary,
  ServerStateBoundary,
} from "@/lib/ServerStatePrefetch";
import { CategoriesClient } from "./CategoriesClient";

/**
 * Master Kategori Barang.
 *
 * SERVER-COMPONENT-FIRST rendering:
 *   - The list is read on the server from the cached payload
 *     (`getStaticCategories` -> `'use cache'` + tag `master:categories`), so no
 *     database round-trip happens on the client and there is no loading flash.
 *   - The SAME payload is pushed into the React Query cache under the shared
 *     `master:categories` key, and `ServerStateBoundary` dehydrates it into the
 *     RSC stream. The client therefore starts with a warm cache and renders real
 *     rows on the first paint.
 *   - Authorization stays in the segment layout (server boundary).
 *
 * The `prefetchQuery` callback runs ONLY on the server; its result — never the
 * function — is what reaches the browser.
 */
export default async function CategoriesPage() {
  const { queryClient, boundary } = await createServerStateBoundary();

  const categories = await getStaticCategories();

  // Seed the cache with the payload we already hold — no second DB read.
  await queryClient.prefetchQuery({
    queryKey: serverStateKeys["master:categories"](),
    queryFn: () => Promise.resolve(categories),
  });

  return (
    <ServerStateBoundary state={boundary.state}>
      <CategoriesClient initial={categories} />
    </ServerStateBoundary>
  );
}
