import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import {
  canonicalPredictionStatus,
  sanitizePredictionThesis,
  sanitizePredictionThesisTitle,
  type Prediction,
} from "@/lib/predictions/types";

export const MAX_WATCHLISTS_PER_USER = 5;
export const MAX_WATCHLIST_NAME_LENGTH = 80;
export const MAX_WATCHLIST_DESCRIPTION_LENGTH = 500;

const LIVE_STATUSES = new Set(["CREATED", "OPEN", "CLOSING"]);
const SETTLED_STATUSES = new Set(["SETTLED"]);

type AuthedUser = {
  uid: string;
};

export type Watchlist = {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  isPublic: true;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
};

export type WatchlistMetrics = {
  liveReturn: number | null;
  settledReturn: number | null;
  livePredictionCount: number;
  settledPredictionCount: number;
};

export type WatchlistSummary = Watchlist & {
  metrics: WatchlistMetrics;
};

export type WatchlistPrediction = Prediction & {
  id: string;
};

export type WatchlistDetail = WatchlistSummary & {
  livePredictions: WatchlistPrediction[];
  settledPredictions: WatchlistPrediction[];
};

export type CreateWatchlistInput = {
  name: string;
  description?: string | null;
};

function trimString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function mapWatchlistDoc(doc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot): Watchlist {
  const data = doc.data() as Record<string, unknown>;
  return {
    id: doc.id,
    userId: trimString(data.userId),
    name: trimString(data.name),
    description: trimString(data.description) || null,
    isPublic: true,
    createdAt: trimString(data.createdAt),
    updatedAt: trimString(data.updatedAt),
    archivedAt: trimString(data.archivedAt) || null,
  };
}

function mapPredictionDoc(doc: FirebaseFirestore.QueryDocumentSnapshot): WatchlistPrediction | null {
  const data = doc.data() as Prediction;
  const status = canonicalPredictionStatus(data.status);
  if (!status || status === "CANCELED") {
    return null;
  }

  return {
    id: doc.id,
    ...data,
    status,
    thesisTitle: sanitizePredictionThesisTitle(data.thesisTitle),
    thesis: sanitizePredictionThesis(data.thesis),
  };
}

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

function metricsForPredictions(predictions: WatchlistPrediction[]): WatchlistMetrics {
  const livePredictions = predictions.filter((prediction) => LIVE_STATUSES.has(prediction.status));
  const settledPredictions = predictions.filter((prediction) => SETTLED_STATUSES.has(prediction.status));

  return {
    liveReturn: average(
      livePredictions
        .map((prediction) => prediction.markReturnValue)
        .filter((value): value is number => typeof value === "number" && Number.isFinite(value)),
    ),
    settledReturn: average(
      settledPredictions
        .map((prediction) => prediction.result?.returnValue)
        .filter((value): value is number => typeof value === "number" && Number.isFinite(value)),
    ),
    livePredictionCount: livePredictions.length,
    settledPredictionCount: settledPredictions.length,
  };
}

async function listWatchlistPredictions(watchlistId: string): Promise<WatchlistPrediction[]> {
  const snapshot = await getAdminFirestore()
    .collection("predictions")
    .where("watchlistId", "==", watchlistId)
    .where("visibility", "==", "PUBLIC")
    .get();

  return snapshot.docs
    .map(mapPredictionDoc)
    .filter((prediction): prediction is WatchlistPrediction => prediction !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function validateCreateWatchlistInput(raw: unknown): CreateWatchlistInput {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid request body");
  }

  const input = raw as Record<string, unknown>;
  const name = trimString(input.name);
  const description = trimString(input.description);

  if (!name) {
    throw new Error("watchlist name is required");
  }

  if (name.length > MAX_WATCHLIST_NAME_LENGTH) {
    throw new Error(`watchlist name must be <= ${MAX_WATCHLIST_NAME_LENGTH} chars`);
  }

  if (description.length > MAX_WATCHLIST_DESCRIPTION_LENGTH) {
    throw new Error(`watchlist description must be <= ${MAX_WATCHLIST_DESCRIPTION_LENGTH} chars`);
  }

  return {
    name,
    description: description || null,
  };
}

export async function listWatchlistsForUser(userId: string): Promise<WatchlistSummary[]> {
  const db = getAdminFirestore();
  const snapshot = await db.collection("watchlists").where("userId", "==", userId).get();
  const watchlists = snapshot.docs
    .map(mapWatchlistDoc)
    .filter((watchlist) => !watchlist.archivedAt)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const summaries = await Promise.all(
    watchlists.map(async (watchlist) => {
      const predictions = await listWatchlistPredictions(watchlist.id);
      return {
        ...watchlist,
        metrics: metricsForPredictions(predictions),
      };
    }),
  );

  return summaries;
}

export async function createWatchlist(input: CreateWatchlistInput, user: AuthedUser): Promise<{ id: string }> {
  const db = getAdminFirestore();
  const nowIso = new Date().toISOString();
  const userRef = db.collection("users").doc(user.uid);
  const watchlistRef = db.collection("watchlists").doc();

  await db.runTransaction(async (tx) => {
    const [userSnapshot, existingSnapshot] = await Promise.all([
      tx.get(userRef),
      tx.get(db.collection("watchlists").where("userId", "==", user.uid)),
    ]);

    if (!userSnapshot.exists) {
      throw new Error("User profile not found. Complete bootstrap first.");
    }

    const activeCount = existingSnapshot.docs.filter((doc) => !trimString(doc.get("archivedAt"))).length;
    if (activeCount >= MAX_WATCHLISTS_PER_USER) {
      throw new Error(`watchlist limit reached. You can create up to ${MAX_WATCHLISTS_PER_USER} watchlists.`);
    }

    tx.set(watchlistRef, {
      userId: user.uid,
      name: input.name,
      description: input.description ?? null,
      isPublic: true,
      createdAt: nowIso,
      updatedAt: nowIso,
      archivedAt: null,
    });
    tx.update(userRef, {
      updatedAt: nowIso,
      "stats.watchlistCount": FieldValue.increment(1),
    });
  });

  return { id: watchlistRef.id };
}

export async function assertWatchlistCanReceivePrediction(
  tx: FirebaseFirestore.Transaction,
  watchlistRef: FirebaseFirestore.DocumentReference,
  userId: string,
): Promise<Watchlist> {
  const snapshot = await tx.get(watchlistRef);
  if (!snapshot.exists) {
    throw new Error("watchlist is required");
  }

  const watchlist = mapWatchlistDoc(snapshot);
  if (watchlist.userId !== userId) {
    throw new Error("watchlist must belong to the prediction author");
  }

  if (watchlist.archivedAt) {
    throw new Error("watchlist is archived");
  }

  return watchlist;
}

export async function getOrCreateDefaultWatchlistForUser(
  userId: string,
  name = "Main Watchlist",
): Promise<string> {
  const existing = await listWatchlistsForUser(userId);
  if (existing[0]) {
    return existing[0].id;
  }

  const created = await createWatchlist({ name, description: null }, { uid: userId });
  return created.id;
}

export async function getWatchlistDetail(watchlistId: string): Promise<WatchlistDetail | null> {
  const snapshot = await getAdminFirestore().collection("watchlists").doc(watchlistId).get();
  if (!snapshot.exists) {
    return null;
  }

  const watchlist = mapWatchlistDoc(snapshot);
  if (watchlist.archivedAt) {
    return null;
  }

  const predictions = await listWatchlistPredictions(watchlist.id);
  const metrics = metricsForPredictions(predictions);

  return {
    ...watchlist,
    metrics,
    livePredictions: predictions.filter((prediction) => LIVE_STATUSES.has(prediction.status)),
    settledPredictions: predictions.filter((prediction) => SETTLED_STATUSES.has(prediction.status)),
  };
}
