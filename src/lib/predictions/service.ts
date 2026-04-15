import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getLatestPrice } from "@/lib/predictions/market-data";
import {
  isPredictionDirection,
  isPredictionVisibility,
  normalizeTicker,
  sanitizePredictionThesis,
  splitIsoDateTime,
  type CreatePredictionInput,
  type Prediction,
  type PredictionComment,
} from "@/lib/predictions/types";

type AuthedUser = {
  uid: string;
  displayName?: string | null;
  photoURL?: string | null;
};

type ListPredictionsInput = {
  limit?: number;
  status?: "OPEN" | "CLOSED";
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
  const thesis = typeof input.thesis === "string" ? sanitizePredictionThesis(input.thesis) : "";
  const visibility = input.visibility;

  if (!ticker || ticker.length > 12) {
    throw new Error("ticker is required and must be <= 12 chars");
  }

  if (!isPredictionDirection(direction)) {
    throw new Error("direction must be UP or DOWN");
  }

  if (thesis.length > 2000) {
    throw new Error("thesis must be <= 2000 chars");
  }

  const resolvedVisibility = isPredictionVisibility(visibility) ? visibility : "PUBLIC";

  return {
    ticker,
    direction,
    thesis,
    visibility: resolvedVisibility,
  };
}

export async function createPrediction(input: CreatePredictionInput, user: AuthedUser) {
  const db = getAdminFirestore();
  const nowIso = new Date().toISOString();
  const quote = await getLatestPrice(input.ticker);
  const { entryDate, entryTime } = splitIsoDateTime(quote.capturedAt);
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
      thesis: sanitizePredictionThesis(input.thesis),
      status: "OPEN",
      visibility: input.visibility ?? "PUBLIC",
      commentCount: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
      markPrice: null,
      markPriceSource: null,
      markPriceDate: null,
      markPriceCapturedAt: null,
      markReturnValue: null,
      markScore: null,
      markDisplayPercent: null,
      closedAt: null,
      result: null,
    };

    tx.set(predictionRef, prediction);
    tx.set(uniqueRef, {
      predictionId: predictionRef.id,
      userId: user.uid,
      ticker: input.ticker,
      direction: input.direction,
      entryDate,
      createdAt: nowIso,
    });

    // If user is still 'user', promote to 'analyst' on first prediction
    if ((userData.role ?? "user") === "user") {
      tx.update(userRef, {
        updatedAt: nowIso,
        role: "analyst",
        "stats.totalPredictions": FieldValue.increment(1),
        "stats.openPredictions": FieldValue.increment(1),
      });
    } else {
      tx.update(userRef, {
        updatedAt: nowIso,
        "stats.totalPredictions": FieldValue.increment(1),
        "stats.openPredictions": FieldValue.increment(1),
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
