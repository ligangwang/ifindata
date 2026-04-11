import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  type Firestore,
} from "firebase/firestore";
import type { User } from "firebase/auth";

type AuthProviderType = "google" | "email";

type UserStats = {
  totalPredictions: number;
  settledPredictions: number;
  totalScore: number;
};

export type UserProfileDocument = {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  provider: AuthProviderType;
  createdAt: unknown;
  stats: UserStats;
};

function getProvider(user: User): AuthProviderType {
  const providerIds = user.providerData.map((entry) => entry.providerId);
  return providerIds.includes("google.com") ? "google" : "email";
}

export async function ensureUserProfileDocument(db: Firestore, user: User): Promise<void> {
  const userRef = doc(db, "users", user.uid);
  const userSnapshot = await getDoc(userRef);

  if (userSnapshot.exists()) {
    return;
  }

  const profile: UserProfileDocument = {
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    provider: getProvider(user),
    createdAt: serverTimestamp(),
    stats: {
      totalPredictions: 0,
      settledPredictions: 0,
      totalScore: 0,
    },
  };

  await setDoc(userRef, profile, { merge: false });
}