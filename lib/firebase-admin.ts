import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import path from "node:path";
import fs from "node:fs";

function createApp(): App {
  const keyPath = path.join(process.cwd(), "serviceAccountKey.json");
  if (!fs.existsSync(keyPath)) {
    throw new Error(
      "Missing serviceAccountKey.json in project root. Download it from Firebase console > Project settings > Service accounts.",
    );
  }
  const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf-8"));
  return initializeApp({
    credential: cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

function getFirebaseApp(): App {
  const apps = getApps();
  return apps.length ? apps[0] : createApp();
}

export function getDb() {
  return getFirestore(getFirebaseApp());
}

export function getBucket() {
  return getStorage(getFirebaseApp()).bucket();
}
