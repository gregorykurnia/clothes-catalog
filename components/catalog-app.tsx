"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shirt, Plus, Tags } from "lucide-react";
import { ItemsTable } from "@/components/items-table";
import { ItemFormDialog } from "@/components/item-form-dialog";
import { CategoryManager } from "@/components/category-manager";
import type { Category, Item, ItemStatus } from "@/lib/types";

const ALL = "all";
type GoingOutFilter = typeof ALL | "yes" | "no";
type StatusFilter = typeof ALL | ItemStatus;

export function CatalogApp({
  items,
  categories,
}: {
  items: Item[];
  categories: Category[];
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [activeCategory, setActiveCategory] = useState<typeof ALL | string>(ALL);
  const [activeStatus, setActiveStatus] = useState<StatusFilter>(ALL);
  const [activeGoingOut, setActiveGoingOut] = useState<GoingOutFilter>(ALL);

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
    () =>
      items.filter(
        (i) =>
          (activeCategory === ALL || i.categoryId === activeCategory) &&
          (activeStatus === ALL || i.status === activeStatus) &&
          (activeGoingOut === ALL || (i.goingOut ? "yes" : "no") === activeGoingOut),
      ),
    [items, activeCategory, activeStatus, activeGoingOut],
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
            <Select
              value={activeCategory}
              onValueChange={(value) => setActiveCategory(value ?? ALL)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Category">
                  {(value: string | null) =>
                    value && value !== ALL
                      ? `${categories.find((c) => c.id === value)?.name ?? "Category"} (${byCategory.get(value) ?? 0})`
                      : `All categories (${items.length})`
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All categories ({items.length})</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} ({byCategory.get(c.id) ?? 0})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={activeStatus}
              onValueChange={(value) => setActiveStatus((value as StatusFilter) ?? ALL)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status">
                  {(value: string | null) =>
                    value === "present" ? "Present" : value === "washed" ? "Washed" : "All statuses"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All statuses</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="washed">Washed</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={activeGoingOut}
              onValueChange={(value) => setActiveGoingOut((value as GoingOutFilter) ?? ALL)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Going Out?">
                  {(value: string | null) =>
                    value === "yes" ? "Going out: Yes" : value === "no" ? "Going out: No" : "Going out: All"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Going out: All</SelectItem>
                <SelectItem value="yes">Going out: Yes</SelectItem>
                <SelectItem value="no">Going out: No</SelectItem>
              </SelectContent>
            </Select>
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
