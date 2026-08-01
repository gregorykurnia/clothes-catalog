"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Plus, Trash2, X, Check, Settings, GripVertical } from "lucide-react";
import type { Category } from "@/lib/types";
import {
  createCategory,
  deleteCategory,
  renameCategory,
  reorderCategories,
} from "@/lib/actions/categories";
import { toast } from "sonner";
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableCategoryRow({
  category,
  editingId,
  editingName,
  busy,
  setEditingName,
  onStartEdit,
  onRename,
  onCancelEdit,
  onDelete,
}: {
  category: Category;
  editingId: string | null;
  editingName: string;
  busy: boolean;
  setEditingName: (name: string) => void;
  onStartEdit: (c: Category) => void;
  onRename: (id: string) => void;
  onCancelEdit: () => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-md border px-3 py-2 bg-background"
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      {editingId === category.id ? (
        <>
          <Input
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            className="h-8"
            autoFocus
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onRename(category.id)}
            disabled={busy}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onCancelEdit}>
            <X className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <>
          <span className="flex-1 text-sm">{category.name}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onStartEdit(category)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onDelete(category.id)}
            disabled={busy}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
}

export function CategoryManager({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [busy, setBusy] = useState(false);
  const [orderedCategories, setOrderedCategories] = useState(categories);
  const router = useRouter();

  useEffect(() => {
    setOrderedCategories(categories);
  }, [categories]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setBusy(true);
    try {
      await createCategory(newName);
      setNewName("");
      toast.success("Category added");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add category");
    } finally {
      setBusy(false);
    }
  }

  async function handleRename(id: string) {
    if (!editingName.trim()) return;
    setBusy(true);
    try {
      await renameCategory(id, editingName);
      setEditingId(null);
      toast.success("Category renamed");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to rename category");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    setBusy(true);
    try {
      await deleteCategory(id);
      toast.success("Category deleted");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete category");
    } finally {
      setBusy(false);
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedCategories.findIndex((c) => c.id === active.id);
    const newIndex = orderedCategories.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(orderedCategories, oldIndex, newIndex);
    setOrderedCategories(reordered);

    try {
      await reorderCategories(reordered.map((c) => c.id));
      router.refresh();
    } catch {
      toast.error("Failed to save new order");
      setOrderedCategories(categories);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Categories
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage categories</DialogTitle>
          <DialogDescription>
            Add, rename, remove, or drag to reorder clothing categories.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreate} className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New category name"
          />
          <Button type="submit" size="icon" disabled={busy}>
            <Plus className="h-4 w-4" />
          </Button>
        </form>
        <div className="flex flex-col gap-1 max-h-80 overflow-y-auto">
          {orderedCategories.length === 0 && (
            <p className="text-sm text-muted-foreground py-2">No categories yet.</p>
          )}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={orderedCategories.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {orderedCategories.map((c) => (
                <SortableCategoryRow
                  key={c.id}
                  category={c}
                  editingId={editingId}
                  editingName={editingName}
                  busy={busy}
                  setEditingName={setEditingName}
                  onStartEdit={(cat) => {
                    setEditingId(cat.id);
                    setEditingName(cat.name);
                  }}
                  onRename={handleRename}
                  onCancelEdit={() => setEditingId(null)}
                  onDelete={handleDelete}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </DialogContent>
    </Dialog>
  );
}
