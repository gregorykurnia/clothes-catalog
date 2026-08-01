"use server";

import { getDb } from "@/lib/firebase-admin";
import type { Category } from "@/lib/types";
import { revalidatePath } from "next/cache";

const COLLECTION = "categories";

export async function listCategories(): Promise<Category[]> {
  const db = getDb();
  const snap = await db.collection(COLLECTION).get();
  const docs = snap.docs.map((doc) => ({
    id: doc.id,
    name: doc.data().name as string,
    order: doc.data().order as number | undefined,
  }));

  const sorted = [...docs].sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
    if (a.order !== undefined) return -1;
    if (b.order !== undefined) return 1;
    return a.name.localeCompare(b.name);
  });

  // Backfill an `order` for any legacy docs created before ordering existed.
  const missing = sorted.filter((d) => d.order === undefined);
  if (missing.length > 0) {
    const batch = db.batch();
    sorted.forEach((d, i) => {
      if (d.order === undefined) {
        batch.update(db.collection(COLLECTION).doc(d.id), { order: i });
      }
    });
    await batch.commit();
  }

  return sorted.map((d, i) => ({ id: d.id, name: d.name, order: d.order ?? i }));
}

export async function createCategory(name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Category name is required");
  const db = getDb();
  const snap = await db.collection(COLLECTION).get();
  const maxOrder = snap.docs.reduce(
    (max, doc) => Math.max(max, (doc.data().order as number | undefined) ?? -1),
    -1,
  );
  await db.collection(COLLECTION).add({ name: trimmed, order: maxOrder + 1 });
  revalidatePath("/", "layout");
}

export async function reorderCategories(orderedIds: string[]): Promise<void> {
  const db = getDb();
  const batch = db.batch();
  orderedIds.forEach((id, index) => {
    batch.update(db.collection(COLLECTION).doc(id), { order: index });
  });
  await batch.commit();
  revalidatePath("/", "layout");
}

export async function renameCategory(id: string, name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Category name is required");
  await getDb().collection(COLLECTION).doc(id).update({ name: trimmed });
  revalidatePath("/", "layout");
}

export async function deleteCategory(id: string): Promise<void> {
  const db = getDb();
  const itemsUsingCategory = await db
    .collection("items")
    .where("categoryId", "==", id)
    .limit(1)
    .get();
  if (!itemsUsingCategory.empty) {
    throw new Error("Cannot delete a category that still has items assigned to it");
  }
  await db.collection(COLLECTION).doc(id).delete();
  revalidatePath("/", "layout");
}
