"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Shirt, Plus, Tags } from "lucide-react";
import { ItemsTable } from "@/components/items-table";
import { ItemFormDialog } from "@/components/item-form-dialog";
import { CategoryManager } from "@/components/category-manager";
import type { Category, Item } from "@/lib/types";

export function CatalogApp({
  items,
  categories,
}: {
  items: Item[];
  categories: Category[];
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) {
      map.set(item.categoryId, (map.get(item.categoryId) ?? 0) + 1);
    }
    return map;
  }, [items]);

  const stats = useMemo(
    () => ({
      total: items.length,
      categoryCount: categories.length,
    }),
    [items, categories],
  );

  const filteredItems = useMemo(
    () => (activeCategory ? items.filter((i) => i.categoryId === activeCategory) : items),
    [items, activeCategory],
  );

  return (
    <div className="min-h-screen w-full bg-muted/30">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Shirt className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">My Clothes Catalog</h1>
              <p className="text-xs text-muted-foreground leading-tight">
                {stats.total} {stats.total === 1 ? "item" : "items"} across{" "}
                {stats.categoryCount} {stats.categoryCount === 1 ? "category" : "categories"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <CategoryManager categories={categories} />
            <Button
              onClick={() => {
                setEditingItem(null);
                setFormOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add item
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {categories.length === 0 && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            <Tags className="h-4 w-4 shrink-0" />
            <span>
              You don&apos;t have any categories yet. Click <strong>Categories</strong> to add
              some (e.g. Kemeja, Polo, Shorts, Long Pants) before adding items.
            </span>
          </div>
        )}

        {categories.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveCategory(null)}
              className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                activeCategory === null
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted"
              }`}
            >
              All <span className="opacity-70">({items.length})</span>
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActiveCategory(c.id)}
                className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                  activeCategory === c.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground hover:bg-muted"
                }`}
              >
                {c.name} <span className="opacity-70">({byCategory.get(c.id) ?? 0})</span>
              </button>
            ))}
          </div>
        )}

        <div className="rounded-xl border bg-background p-4 shadow-sm sm:p-6">
          <ItemsTable
            items={filteredItems}
            categories={categories}
            onEdit={(item) => {
              setEditingItem(item);
              setFormOpen(true);
            }}
          />
        </div>
      </main>

      <ItemFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        categories={categories}
        item={editingItem}
      />
    </div>
  );
}
