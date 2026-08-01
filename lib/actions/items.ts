"use server";

import { getBucket, getDb } from "@/lib/firebase-admin";
import type { Item } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";

const COLLECTION = "items";

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
      createdAt: data.createdAt as number,
    };
  });
}

async function uploadPhoto(file: File): Promise<string> {
  const bucket = getBucket();
  const ext = file.name.split(".").pop() ?? "jpg";
  const filename = `items/${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const blob = bucket.file(filename);
  await blob.save(buffer, { contentType: file.type, public: true });
  return `https://storage.googleapis.com/${bucket.name}/${filename}`;
}

export async function createItem(formData: FormData): Promise<void> {
  const name = (formData.get("name") as string)?.trim();
  const categoryId = formData.get("categoryId") as string;
  const brand = ((formData.get("brand") as string) ?? "").trim();
  const photo = formData.get("photo") as File | null;

  if (!name) throw new Error("Name is required");
  if (!categoryId) throw new Error("Category is required");

  let photoUrl: string | null = null;
  if (photo && photo.size > 0) {
    photoUrl = await uploadPhoto(photo);
  }

  await getDb()
    .collection(COLLECTION)
    .add({ name, categoryId, brand, photoUrl, createdAt: Date.now() });
  revalidatePath("/", "layout");
}

export async function updateItem(id: string, formData: FormData): Promise<void> {
  const name = (formData.get("name") as string)?.trim();
  const categoryId = formData.get("categoryId") as string;
  const brand = ((formData.get("brand") as string) ?? "").trim();
  const photo = formData.get("photo") as File | null;

  if (!name) throw new Error("Name is required");
  if (!categoryId) throw new Error("Category is required");

  const update: Record<string, unknown> = { name, categoryId, brand };
  if (photo && photo.size > 0) {
    update.photoUrl = await uploadPhoto(photo);
  }

  await getDb().collection(COLLECTION).doc(id).update(update);
  revalidatePath("/", "layout");
}

export async function deleteItem(id: string): Promise<void> {
  await getDb().collection(COLLECTION).doc(id).delete();
  revalidatePath("/", "layout");
}
