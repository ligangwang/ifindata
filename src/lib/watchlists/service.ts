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

export type PublicWatchlistSummary = WatchlistSummary & {
  owner: {
    id: string;
    displayName: string | null;
    nickname: string | null;
    photoURL: string | null;
  };
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

export type UpdateWatchlistInput = CreateWatchlistInput;

export type BackfillWatchlistsInput = {
  dryRun?: boolean;
  limit?: number;
  defaultName?: string;
};

export type BackfillWatchlistsResult = {
  dryRun: boolean;
  scanned: number;
  updated: number;
  skipped: number;
  usersTouched: number;
  hasMore: boolean;
  defaultName: string;
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

function watchlistPerformanceValue(metrics: WatchlistMetrics): number | null {
  if (typeof metrics.settledReturn === "number" && Number.isFinite(metrics.settledReturn)) {
    return metrics.settledReturn;
  }

  if (typeof metrics.liveReturn === "number" && Number.isFinite(metrics.liveReturn)) {
    return metrics.liveReturn;
  }

  return null;
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

export const validateUpdateWatchlistInput = validateCreateWatchlistInput;

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

export async function listPublicWatchlists(limit = 24): Promise<PublicWatchlistSummary[]> {
  const db = getAdminFirestore();
  const clampedLimit = Math.max(1, Math.min(limit, 48));
  const snapshot = await db.collection("watchlists").orderBy("createdAt", "desc").limit(clampedLimit).get();
  const watchlists = snapshot.docs
    .map(mapWatchlistDoc)
    .filter((watchlist) => !watchlist.archivedAt);

  const ownerIds = Array.from(new Set(watchlists.map((watchlist) => watchlist.userId).filter(Boolean)));
  const ownerEntries = await Promise.all(
    ownerIds.map(async (userId) => {
      const userSnapshot = await db.collection("users").doc(userId).get();
      const data = userSnapshot.data() as Record<string, unknown> | undefined;
      const settings = data?.settings;
      const isPublic = !settings || typeof settings !== "object"
        ? true
        : (settings as Record<string, unknown>).isPublic !== false;

      return [userId, isPublic ? {
        id: userId,
        displayName: typeof data?.displayName === "string" ? data.displayName : null,
        nickname: typeof data?.nickname === "string" ? data.nickname : null,
        photoURL: typeof data?.photoURL === "string" ? data.photoURL : null,
      } : null] as const;
    }),
  );
  const ownerById = new Map(ownerEntries);

  const summaries = await Promise.all(
    watchlists.map(async (watchlist) => {
      const owner = ownerById.get(watchlist.userId);
      if (!owner) {
        return null;
      }

      const predictions = await listWatchlistPredictions(watchlist.id);
      return {
        ...watchlist,
        metrics: metricsForPredictions(predictions),
        owner,
      };
    }),
  );

  return summaries
    .filter((summary): summary is PublicWatchlistSummary => summary !== null)
    .sort((a, b) => {
      const aPerformance = watchlistPerformanceValue(a.metrics);
      const bPerformance = watchlistPerformanceValue(b.metrics);

      if (aPerformance !== null && bPerformance !== null && aPerformance !== bPerformance) {
        return bPerformance - aPerformance;
      }

      if (aPerformance !== null && bPerformance === null) {
        return -1;
      }

      if (aPerformance === null && bPerformance !== null) {
        return 1;
      }

      return b.createdAt.localeCompare(a.createdAt);
    });
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

export async function updateWatchlist(
  watchlistId: string,
  input: UpdateWatchlistInput,
  user: AuthedUser,
): Promise<{ updated: true }> {
  const db = getAdminFirestore();
  const nowIso = new Date().toISOString();
  const watchlistRef = db.collection("watchlists").doc(watchlistId);

  await db.runTransaction(async (tx) => {
    const watchlistSnapshot = await tx.get(watchlistRef);
    if (!watchlistSnapshot.exists) {
      throw new Error("Watchlist not found");
    }

    const watchlist = mapWatchlistDoc(watchlistSnapshot);
    if (watchlist.userId !== user.uid) {
      throw new Error("Forbidden");
    }

    if (watchlist.archivedAt) {
      throw new Error("Watchlist not found");
    }

    tx.update(watchlistRef, {
      name: input.name,
      description: input.description ?? null,
      updatedAt: nowIso,
    });
  });

  const predictionSnapshot = await db.collection("predictions").where("watchlistId", "==", watchlistId).get();
  let batch = db.batch();
  let batchSize = 0;
  for (const doc of predictionSnapshot.docs) {
    batch.update(doc.ref, {
      watchlistName: input.name,
      updatedAt: nowIso,
    });
    batchSize += 1;
    if (batchSize === 450) {
      await batch.commit();
      batch = db.batch();
      batchSize = 0;
    }
  }
  if (batchSize > 0) {
    await batch.commit();
  }

  return { updated: true };
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

async function findRawWatchlistForBackfill(userId: string, defaultName: string): Promise<Watchlist | null> {
  const snapshot = await getAdminFirestore().collection("watchlists").where("userId", "==", userId).get();
  const active = snapshot.docs
    .map(mapWatchlistDoc)
    .filter((watchlist) => !watchlist.archivedAt)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return active.find((watchlist) => watchlist.name === defaultName) ?? active[0] ?? null;
}

export async function movePredictionToWatchlist(
  predictionId: string,
  watchlistId: string,
  user: AuthedUser,
): Promise<{ moved: true; watchlistId: string; watchlistName: string }> {
  const db = getAdminFirestore();
  const nowIso = new Date().toISOString();
  const predictionRef = db.collection("predictions").doc(predictionId);
  const watchlistRef = db.collection("watchlists").doc(watchlistId);
  let movedWatchlistId = "";
  let movedWatchlistName = "";

  await db.runTransaction(async (tx) => {
    const predictionSnapshot = await tx.get(predictionRef);
    if (!predictionSnapshot.exists) {
      throw new Error("Prediction not found");
    }

    const prediction = predictionSnapshot.data() as Prediction;
    if (prediction.userId !== user.uid) {
      throw new Error("Forbidden");
    }

    const status = canonicalPredictionStatus(prediction.status);
    if (!status || status === "CANCELED") {
      throw new Error("Prediction not found");
    }

    const watchlist = await assertWatchlistCanReceivePrediction(tx, watchlistRef, user.uid);
    movedWatchlistId = watchlist.id;
    movedWatchlistName = watchlist.name;
    tx.update(predictionRef, {
      watchlistId: watchlist.id,
      watchlistName: watchlist.name,
      updatedAt: nowIso,
    });
  });

  if (!movedWatchlistId) {
    throw new Error("Watchlist not found");
  }

  return {
    moved: true,
    watchlistId: movedWatchlistId,
    watchlistName: movedWatchlistName,
  };
}

export async function backfillLegacyPredictionWatchlists(
  input: BackfillWatchlistsInput = {},
): Promise<BackfillWatchlistsResult> {
  const db = getAdminFirestore();
  const dryRun = input.dryRun === true;
  const parsedLimit = Number(input.limit ?? 500);
  const limit = Number.isFinite(parsedLimit)
    ? Math.max(1, Math.min(Math.trunc(parsedLimit), 1000))
    : 500;
  const defaultName = trimString(input.defaultName) || "Main Watchlist";
  const docs: FirebaseFirestore.QueryDocumentSnapshot[] = [];
  let scanned = 0;
  let hasMore = false;
  let lastDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null;

  while (docs.length < limit) {
    let query = db.collection("predictions").orderBy("createdAt", "desc").limit(500);
    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const snapshot = await query.get();
    scanned += snapshot.docs.length;
    if (snapshot.empty) {
      hasMore = false;
      break;
    }

    for (const doc of snapshot.docs) {
      if (!trimString(doc.get("watchlistId"))) {
        docs.push(doc);
        if (docs.length === limit) {
          break;
        }
      }
    }

    lastDoc = snapshot.docs.at(-1) ?? null;
    hasMore = snapshot.docs.length === 500;
    if (!hasMore) {
      break;
    }
  }
  const nowIso = new Date().toISOString();
  const watchlistByUserId = new Map<string, Watchlist>();
  let updated = 0;
  let skipped = 0;

  for (const doc of docs) {
    const prediction = doc.data() as Prediction;
    const userId = trimString(prediction.userId);
    const status = canonicalPredictionStatus(prediction.status);
    if (!userId || !status || status === "CANCELED") {
      skipped += 1;
      continue;
    }

    let watchlist = watchlistByUserId.get(userId);
    if (!watchlist) {
      const existing = await findRawWatchlistForBackfill(userId, defaultName);
      if (existing) {
        watchlist = existing;
      } else if (dryRun) {
        watchlist = {
          id: `dry_run_default_${userId}`,
          userId,
          name: defaultName,
          description: null,
          isPublic: true,
          createdAt: nowIso,
          updatedAt: nowIso,
          archivedAt: null,
        };
      } else {
        const created = await createWatchlist({ name: defaultName, description: null }, { uid: userId });
        const createdSnapshot = await db.collection("watchlists").doc(created.id).get();
        watchlist = mapWatchlistDoc(createdSnapshot);
      }
      watchlistByUserId.set(userId, watchlist);
    }

    if (!dryRun) {
      await doc.ref.update({
        watchlistId: watchlist.id,
        watchlistName: watchlist.name,
        updatedAt: nowIso,
      });
    }
    updated += 1;
  }

  return {
    dryRun,
    scanned,
    updated,
    skipped,
    usersTouched: watchlistByUserId.size,
    hasMore,
    defaultName,
  };
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
