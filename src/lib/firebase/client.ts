import { type FirebaseOptions, getApp, getApps, initializeApp } from "firebase/app";
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  getAuth,
  setPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseEnvKeys = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
] as const;

type FirebaseEnvKey = (typeof firebaseEnvKeys)[number];

function getFirebaseClientConfig(): FirebaseOptions | null {
  const missingKey = firebaseEnvKeys.find((envKey) => !process.env[envKey]);

  if (missingKey) {
    return null;
  }

  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  } satisfies FirebaseOptions;
}

export function getMissingFirebaseKeys(): FirebaseEnvKey[] {
  return firebaseEnvKeys.filter((envKey) => !process.env[envKey]);
}

let persistenceReadyPromise: Promise<void> | null = null;

export function getFirebaseServices() {
  if (typeof window === "undefined") {
    return null;
  }

  const config = getFirebaseClientConfig();

  if (!config) {
    return null;
  }

  const app = getApps().length > 0 ? getApp() : initializeApp(config);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const googleProvider = new GoogleAuthProvider();

  googleProvider.setCustomParameters({
    prompt: "select_account",
  });

  if (!persistenceReadyPromise) {
    persistenceReadyPromise = setPersistence(auth, browserLocalPersistence).catch(() => undefined);
  }

  return {
    app,
    auth,
    db,
    googleProvider,
    persistenceReady: persistenceReadyPromise,
  };
}