"use server";

import { getDb } from "@/lib/firebase-admin";
import type { Item, ItemStatus } from "@/lib/types";
import { revalidatePath } from "next/cache";

const COLLECTION = "items";

function parseStatus(value: unknown): ItemStatus {
  return value === "washed" ? "washed" : "present";
}

export async function listItems(): Promise<Item[]> {
  const snap = await getDb().collection(COLLECTION).orderBy("createdAt", "desc").get();
  return snap.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name as string,
      photoUrl: (data.photoUrl as string) ?? null,
      categoryId: data.categoryId as string,
      brand: (data.brand as string) ?? "",
      status: parseStatus(data.status),
      goingOut: (data.goingOut as boolean) ?? false,
      createdAt: data.createdAt as number,
      updatedAt: (data.updatedAt as number) ?? (data.createdAt as number),
    };
  });
}

export async function createItem(formData: FormData): Promise<void> {
  const name = (formData.get("name") as string)?.trim();
  const categoryId = formData.get("categoryId") as string;
  const brand = ((formData.get("brand") as string) ?? "").trim();
  const photoUrl = ((formData.get("photoUrl") as string) ?? "").trim() || null;
  const status = parseStatus(formData.get("status"));
  const goingOut = formData.get("goingOut") === "yes";

  if (!name) throw new Error("Name is required");
  if (!categoryId) throw new Error("Category is required");

  const now = Date.now();
  await getDb()
    .collection(COLLECTION)
    .add({ name, categoryId, brand, photoUrl, status, goingOut, createdAt: now, updatedAt: now });
  revalidatePath("/", "layout");
}

export async function updateItem(id: string, formData: FormData): Promise<void> {
  const name = (formData.get("name") as string)?.trim();
  const categoryId = formData.get("categoryId") as string;
  const brand = ((formData.get("brand") as string) ?? "").trim();
  const photoUrl = (formData.get("photoUrl") as string)?.trim();
  const status = parseStatus(formData.get("status"));
  const goingOut = formData.get("goingOut") === "yes";

  if (!name) throw new Error("Name is required");
  if (!categoryId) throw new Error("Category is required");

  const update: Record<string, unknown> = { name, categoryId, brand, status, goingOut, updatedAt: Date.now() };
  if (photoUrl) {
    update.photoUrl = photoUrl;
  }

  await getDb().collection(COLLECTION).doc(id).update(update);
  revalidatePath("/", "layout");
}

export async function updateItemStatus(id: string, status: ItemStatus): Promise<number> {
  const updatedAt = Date.now();
  await getDb().collection(COLLECTION).doc(id).update({ status, updatedAt });
  revalidatePath("/", "layout");
  return updatedAt;
}

export async function updateItemGoingOut(id: string, goingOut: boolean): Promise<number> {
  const updatedAt = Date.now();
  await getDb().collection(COLLECTION).doc(id).update({ goingOut, updatedAt });
  revalidatePath("/", "layout");
  return updatedAt;
}

export async function deleteItem(id: string): Promise<void> {
  await getDb().collection(COLLECTION).doc(id).delete();
  revalidatePath("/", "layout");
}
