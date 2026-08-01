import { CatalogApp } from "@/components/catalog-app";
import { listCategories } from "@/lib/actions/categories";
import { listItems } from "@/lib/actions/items";

export default async function Home() {
  const [items, categories] = await Promise.all([listItems(), listCategories()]);
  return <CatalogApp items={items} categories={categories} />;
}
