"use server";

import { getDb } from "@/lib/firebase-admin";
import type { Category } from "@/lib/types";
import { revalidatePath } from "next/cache";

const COLLECTION = "categories";

export async function listCategories(): Promise<Category[]> {
  const snap = await getDb().collection(COLLECTION).orderBy("name").get();
  return snap.docs.map((doc) => ({ id: doc.id, name: doc.data().name as string }));
}

export async function createCategory(name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Category name is required");
  await getDb().collection(COLLECTION).add({ name: trimmed });
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
