import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getLatestPrice } from "@/lib/predictions/market-data";
import {
  computeDisplayPercent,
  computeReturnValue,
  computeScoreFromReturn,
  isPredictionDirection,
  isPredictionVisibility,
  normalizeTicker,
  sanitizePredictionThesis,
  splitIsoDateTime,
  type CreatePredictionInput,
  type Prediction,
  type PredictionComment,
  type PredictionResult,
} from "@/lib/predictions/types";

type AuthedUser = {
  uid: string;
  displayName?: string | null;
  photoURL?: string | null;
};

type ListPredictionsInput = {
  limit?: number;
  status?: "ACTIVE" | "SETTLED";
  userId?: string;
  cursorCreatedAt?: string;
  includePrivate?: boolean;
};

type ListPredictionsResult = {
  items: Array<Prediction & { id: string; authorNickname: string | null }>;
  nextCursor: string | null;
};

export async function listPredictions(input: ListPredictionsInput): Promise<ListPredictionsResult> {
  const db = getAdminFirestore();
  const clampedLimit = Math.max(1, Math.min(input.limit ?? 20, 50));
  const status = input.status;
  const userId = input.userId?.trim() ?? "";
  const includePrivate = input.includePrivate === true;

  let query = db.collection("predictions") as FirebaseFirestore.Query;

  if (userId) {
    query = query.where("userId", "==", userId);
    if (!includePrivate) {
      query = query.where("visibility", "==", "PUBLIC");
    }
  } else {
    query = query.where("visibility", "==", "PUBLIC");
  }

  if (status) {
    query = query.where("status", "==", status);
  }

  query = query.orderBy("createdAt", "desc").limit(clampedLimit + 1);

  const cursor = input.cursorCreatedAt?.trim();
  if (cursor) {
    const cursorDate = new Date(cursor);
    if (!Number.isNaN(cursorDate.getTime())) {
      query = query.startAfter(cursorDate.toISOString());
    }
  }

  const snapshot = await query.get();
  const docs = snapshot.docs;
  const hasMore = docs.length > clampedLimit;
  const selected = hasMore ? docs.slice(0, clampedLimit) : docs;
  const items = selected.map((doc) => {
    const prediction = doc.data() as Prediction;

    return {
      id: doc.id,
      ...prediction,
      thesis: sanitizePredictionThesis(prediction.thesis),
    };
  });

  const uniqueUserIds = Array.from(new Set(items.map((item) => item.userId).filter(Boolean)));
  const nicknameEntries = await Promise.all(
    uniqueUserIds.map(async (id) => {
      const userSnapshot = await db.collection("users").doc(id).get();
      const userData = userSnapshot.data() as Record<string, unknown> | undefined;
      const nickname = typeof userData?.nickname === "string" ? userData.nickname : null;
      return [id, nickname] as const;
    }),
  );
  const nicknameByUserId = new Map<string, string | null>(nicknameEntries);

  const itemsWithNickname = items.map((item) => ({
    ...item,
    authorNickname: nicknameByUserId.get(item.userId) ?? null,
  }));

  const nextCursor = hasMore && selected.length > 0 ? selected[selected.length - 1].get("createdAt") : null;

  return {
    items: itemsWithNickname,
    nextCursor: typeof nextCursor === "string" ? nextCursor : null,
  };
}

export function validateCreatePredictionInput(raw: unknown): CreatePredictionInput {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid request body");
  }

  const input = raw as Record<string, unknown>;
  const ticker = typeof input.ticker === "string" ? normalizeTicker(input.ticker) : "";
  const direction = input.direction;
  const expiryAt = typeof input.expiryAt === "string" ? input.expiryAt : "";
  const thesis = typeof input.thesis === "string" ? sanitizePredictionThesis(input.thesis) : "";
  const visibility = input.visibility;

  if (!ticker || ticker.length > 12) {
    throw new Error("ticker is required and must be <= 12 chars");
  }

  if (!isPredictionDirection(direction)) {
    throw new Error("direction must be UP or DOWN");
  }

  const expiry = new Date(expiryAt);
  if (!expiryAt || Number.isNaN(expiry.getTime())) {
    throw new Error("expiryAt must be an ISO timestamp");
  }

  if (expiry.getTime() <= Date.now()) {
    throw new Error("expiryAt must be in the future");
  }

  if (thesis.length > 2000) {
    throw new Error("thesis must be <= 2000 chars");
  }

  const resolvedVisibility = isPredictionVisibility(visibility) ? visibility : "PUBLIC";

  return {
    ticker,
    direction,
    expiryAt,
    thesis,
    visibility: resolvedVisibility,
  };
}

export async function createPrediction(input: CreatePredictionInput, user: AuthedUser) {
  const db = getAdminFirestore();
  const nowIso = new Date().toISOString();
  const quote = await getLatestPrice(input.ticker);
  const { entryDate, entryTime } = splitIsoDateTime(quote.capturedAt);
  const { entryDate: expiryDate } = splitIsoDateTime(input.expiryAt);
  const duplicateKey = [user.uid, input.ticker, entryDate].join("__");
  const predictionRef = db.collection("predictions").doc();
  const userRef = db.collection("users").doc(user.uid);
  const uniqueRef = db.collection("prediction_uniques").doc(duplicateKey);


  await db.runTransaction(async (tx) => {
    const [userSnapshot, uniqueSnapshot] = await Promise.all([tx.get(userRef), tx.get(uniqueRef)]);
    if (!userSnapshot.exists) {
      throw new Error("User profile not found. Complete bootstrap first.");
    }

    if (uniqueSnapshot.exists) {
      throw new Error("Duplicate prediction exists for the same user, ticker, and entryDate.");
    }

    const userData = userSnapshot.data() ?? {};
    const prediction: Prediction = {
      userId: user.uid,
      authorDisplayName:
        (userData.displayName as string | null | undefined) ?? user.displayName ?? null,
      authorPhotoURL: (userData.photoURL as string | null | undefined) ?? user.photoURL ?? null,
      ticker: input.ticker,
      direction: input.direction,
      entryPrice: quote.price,
      entryPriceSource: quote.source,
      entryDate,
      entryTime,
      entryCapturedAt: quote.capturedAt,
      expiryDate,
      expiryAt: input.expiryAt,
      thesis: sanitizePredictionThesis(input.thesis),
      status: "ACTIVE",
      visibility: input.visibility ?? "PUBLIC",
      commentCount: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
      settledAt: null,
      result: null,
    };

    tx.set(predictionRef, prediction);
    tx.set(uniqueRef, {
      predictionId: predictionRef.id,
      userId: user.uid,
      ticker: input.ticker,
      direction: input.direction,
      entryDate,
      expiryDate,
      createdAt: nowIso,
    });

    // If user is still 'user', promote to 'analyst' on first prediction
    if ((userData.role ?? "user") === "user") {
      tx.update(userRef, {
        updatedAt: nowIso,
        role: "analyst",
        "stats.totalPredictions": FieldValue.increment(1),
        "stats.activePredictions": FieldValue.increment(1),
      });
    } else {
      tx.update(userRef, {
        updatedAt: nowIso,
        "stats.totalPredictions": FieldValue.increment(1),
        "stats.activePredictions": FieldValue.increment(1),
      });
    }
  });

  return { id: predictionRef.id };
}

export async function addComment(predictionId: string, content: string, user: AuthedUser) {
  const db = getAdminFirestore();
  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error("content is required");
  }
  if (trimmed.length > 2000) {
    throw new Error("content must be <= 2000 chars");
  }

  const nowIso = new Date().toISOString();
  const predictionRef = db.collection("predictions").doc(predictionId);
  const commentRef = predictionRef.collection("comments").doc();
  const userRef = db.collection("users").doc(user.uid);

  await db.runTransaction(async (tx) => {
    const [predictionSnapshot, userSnapshot] = await Promise.all([
      tx.get(predictionRef),
      tx.get(userRef),
    ]);

    if (!predictionSnapshot.exists) {
      throw new Error("Prediction not found");
    }

    if (!userSnapshot.exists) {
      throw new Error("User profile not found. Complete bootstrap first.");
    }

    const userData = userSnapshot.data() ?? {};
    const comment: PredictionComment = {
      predictionId,
      userId: user.uid,
      authorDisplayName:
        (userData.displayName as string | null | undefined) ?? user.displayName ?? null,
      authorPhotoURL: (userData.photoURL as string | null | undefined) ?? user.photoURL ?? null,
      content: trimmed,
      createdAt: nowIso,
      updatedAt: nowIso,
      isDeleted: false,
    };

    tx.set(commentRef, comment);
    tx.update(predictionRef, {
      updatedAt: nowIso,
      commentCount: FieldValue.increment(1),
    });
  });

  return { id: commentRef.id };
}

function assertActivePrediction(prediction: Record<string, unknown>): void {
  if (prediction.status !== "ACTIVE") {
    throw new Error("Prediction is already settled");
  }

  const expiryAt = typeof prediction.expiryAt === "string" ? prediction.expiryAt : "";
  const expiry = new Date(expiryAt);

  if (!expiryAt || Number.isNaN(expiry.getTime())) {
    throw new Error("Prediction has invalid expiryAt");
  }

  if (expiry.getTime() > Date.now()) {
    throw new Error("Prediction has not expired yet");
  }
}

export async function settleExpiredPredictions(limit: number = 100): Promise<{ settled: number }> {
  const db = getAdminFirestore();
  const nowIso = new Date().toISOString();

  const snapshot = await db
    .collection("predictions")
    .where("status", "==", "ACTIVE")
    .where("expiryAt", "<=", nowIso)
    .limit(Math.max(1, Math.min(limit, 500)))
    .get();

  let settled = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data() as Record<string, unknown>;

    try {
      assertActivePrediction(data);
    } catch {
      continue;
    }

    const ticker = typeof data.ticker === "string" ? normalizeTicker(data.ticker) : "";
    const userId = typeof data.userId === "string" ? data.userId : "";
    const direction = data.direction;
    const entryPrice = Number(data.entryPrice);

    if (!ticker || !userId || !isPredictionDirection(direction) || !Number.isFinite(entryPrice) || entryPrice <= 0) {
      continue;
    }

    const exitQuote = await getLatestPrice(ticker);
    const returnValue = computeReturnValue(direction, entryPrice, exitQuote.price);
    const score = computeScoreFromReturn(returnValue);
    const result: PredictionResult = {
      exitPrice: exitQuote.price,
      exitPriceSource: exitQuote.source,
      returnValue,
      score,
      displayPercent: computeDisplayPercent(score),
    };

    const userRef = db.collection("users").doc(userId);

    await db.runTransaction(async (tx) => {
      const [predictionSnapshot, userSnapshot] = await Promise.all([tx.get(doc.ref), tx.get(userRef)]);

      if (!predictionSnapshot.exists || !userSnapshot.exists) {
        return;
      }

      const latest = predictionSnapshot.data() as Record<string, unknown>;
      if (latest.status !== "ACTIVE") {
        return;
      }

      tx.update(doc.ref, {
        status: "SETTLED",
        settledAt: nowIso,
        updatedAt: nowIso,
        result,
      });

      tx.update(userRef, {
        updatedAt: nowIso,
        "stats.activePredictions": FieldValue.increment(-1),
        "stats.settledPredictions": FieldValue.increment(1),
        "stats.totalScore": FieldValue.increment(score),
      });

      settled += 1;
    });
  }

  return { settled };
}