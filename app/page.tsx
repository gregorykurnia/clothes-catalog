import { CatalogApp } from "@/components/catalog-app";
import { listCategories } from "@/lib/actions/categories";
import { listItems } from "@/lib/actions/items";

// This page reads Firestore directly (no fetch/cookies/headers), so Next.js
// would otherwise treat it as a static route and cache the whole rendered
// page. Concurrent revalidatePath calls from rapid dropdown edits can then
// race to write that shared cache, letting a stale regeneration overwrite a
// newer one and revert rows that were never even touched. Forcing dynamic
// rendering means every request always reflects current Firestore data.
export const dynamic = "force-dynamic";

export default async function Home() {
  const [items, categories] = await Promise.all([listItems(), listCategories()]);
  return <CatalogApp items={items} categories={categories} />;
}
