"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Clothes Catalog</h1>
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

      <ItemsTable
        items={items}
        categories={categories}
        onEdit={(item) => {
          setEditingItem(item);
          setFormOpen(true);
        }}
      />

      <ItemFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        categories={categories}
        item={editingItem}
      />
    </div>
  );
}
