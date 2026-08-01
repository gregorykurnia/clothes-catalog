import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import path from "node:path";
import fs from "node:fs";

function loadServiceAccount(): object {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  }
  const keyPath = path.join(process.cwd(), "serviceAccountKey.json");
  if (fs.existsSync(keyPath)) {
    return JSON.parse(fs.readFileSync(keyPath, "utf-8"));
  }
  throw new Error(
    "Missing Firebase credentials. Set FIREBASE_SERVICE_ACCOUNT_KEY (JSON string) or add serviceAccountKey.json locally.",
  );
}

function createApp(): App {
  const serviceAccount = loadServiceAccount();
  return initializeApp({
    credential: cert(serviceAccount),
  });
}

function getFirebaseApp(): App {
  const apps = getApps();
  return apps.length ? apps[0] : createApp();
}

export function getDb() {
  return getFirestore(getFirebaseApp());
}
