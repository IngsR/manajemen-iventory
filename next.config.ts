import type { NextConfig } from "next";

// ── Hybrid Rendering (Cache Components / Partial Prerendering) ────────────────
//
// cacheComponents: true enables "use cache" and Partial Prerendering, which is
// the mechanism behind this app's hybrid rendering strategy:
//
//   • The workspace shell (header / sidebar / topbar) is prerendered ONCE into a
//     static HTML shell and reused for every route — the browser paints it
//     instantly and no server memory is spent re-rendering it per request.
//   • Rarely-changing master data (categories, warehouses, locations, units,
//     items) and the internal documentation pages are cached with "use cache"
//     and revalidated on demand through cache tags after a mutation.
//   • Per-user data (session, live stock/ledger numbers) streams in at request
//     time behind <Suspense> boundaries, so it never blocks the static shell.
//
// See: docs/static-rendering.md and src/lib/StaticData.ts
const nextConfig: NextConfig = {
  cacheComponents: true,
};

export default nextConfig;
