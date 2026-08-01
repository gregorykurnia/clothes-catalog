"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category, Item } from "@/lib/types";
import { createItem, updateItem } from "@/lib/actions/items";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { toast } from "sonner";

export function ItemFormDialog({
  open,
  onOpenChange,
  categories,
  item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  item: Item | null;
}) {
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(item?.name ?? "");
      setBrand(item?.brand ?? "");
      setCategoryId(item?.categoryId ?? categories[0]?.id ?? "");
      setPhoto(null);
    }
  }, [open, item, categories]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("name", name);
      formData.set("brand", brand);
      formData.set("categoryId", categoryId);
      if (photo) {
        const photoUrl = await uploadToCloudinary(photo);
        formData.set("photoUrl", photoUrl);
      }

      if (item) {
        await updateItem(item.id, formData);
        toast.success("Item updated");
      } else {
        await createItem(formData);
        toast.success("Item added");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{item ? "Edit item" : "Add item"}</DialogTitle>
            <DialogDescription>
              Fill in the details for this clothing item.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Blue Polo"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="photo">Photo</Label>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  Take photo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose file
                </Button>
              </div>
              {photo && (
                <p className="text-xs text-muted-foreground">{photo.name}</p>
              )}
              {item?.photoUrl && !photo && (
                <p className="text-xs text-muted-foreground">
                  Leave empty to keep the current photo.
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={categoryId}
                onValueChange={(value) => setCategoryId(value ?? "")}
                required
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category">
                    {(value: string | null) =>
                      categories.find((c) => c.id === value)?.name ?? "Select a category"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Uniqlo"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={submitting || !categoryId}>
              {submitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
