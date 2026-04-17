import { getAdminFirestore } from "@/lib/firebase/admin";
import { NextRequest, NextResponse } from "next/server";

type DailyScoreCard = {
  userId: string;
  date: string;
  displayName: string | null;
  nickname: string | null;
  photoURL: string | null;
  totalScore: number;
  dailyScoreChange: number;
  openPredictions: number;
  closedPredictions: number;
  dailyMarkedPredictions: number;
  bestPredictionId: string | null;
  bestPredictionTicker: string | null;
  bestPredictionScoreChange: number | null;
  worstPredictionId: string | null;
  worstPredictionTicker: string | null;
  worstPredictionScoreChange: number | null;
};

function asNumber(value: unknown): number {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function asNullableNumber(value: unknown): number | null {
  return Number.isFinite(Number(value)) ? Number(value) : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isIsoDate(value: string | null): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parseLimit(raw: string | null): number {
  const parsed = Number(raw ?? "60");
  if (!Number.isFinite(parsed)) {
    return 60;
  }

  return Math.max(1, Math.min(100, Math.trunc(parsed)));
}

function dailyScoreDocId(userId: string, date: string): string {
  return [userId, date].join("_");
}

async function toDailyScoreCard(doc: FirebaseFirestore.DocumentSnapshot): Promise<DailyScoreCard | null> {
  const db = getAdminFirestore();
  const data = doc.data() as Record<string, unknown>;
  const userId = asString(data.userId);
  const date = asString(data.date);

  if (!userId || !date) {
    return null;
  }

  const userSnapshot = await db.collection("users").doc(userId).get();
  const userData = (userSnapshot.data() ?? {}) as Record<string, unknown>;

  return {
    userId,
    date,
    displayName: asString(userData.displayName),
    nickname: asString(userData.nickname),
    photoURL: asString(userData.photoURL),
    totalScore: asNumber(data.totalScore),
    dailyScoreChange: asNumber(data.dailyScoreChange),
    openPredictions: asNumber(data.openPredictions),
    closedPredictions: asNumber(data.closedPredictions),
    dailyMarkedPredictions: asNumber(data.dailyMarkedPredictions),
    bestPredictionId: asString(data.bestPredictionId),
    bestPredictionTicker: asString(data.bestPredictionTicker),
    bestPredictionScoreChange: asNullableNumber(data.bestPredictionScoreChange),
    worstPredictionId: asString(data.worstPredictionId),
    worstPredictionTicker: asString(data.worstPredictionTicker),
    worstPredictionScoreChange: asNullableNumber(data.worstPredictionScoreChange),
  };
}

export async function GET(request: NextRequest) {
  const db = getAdminFirestore();
  const limit = parseLimit(request.nextUrl.searchParams.get("limit"));
  const userId = asString(request.nextUrl.searchParams.get("userId"));
  const date = request.nextUrl.searchParams.get("date");

  try {
    if (userId && isIsoDate(date)) {
      const snapshot = await db.collection("user_daily_scores").doc(dailyScoreDocId(userId, date)).get();
      if (!snapshot.exists) {
        return NextResponse.json({ items: [] });
      }

      const item = await toDailyScoreCard(snapshot);
      return NextResponse.json({ items: item ? [item] : [] });
    }

    let query: FirebaseFirestore.Query = db
      .collection("user_daily_scores")
      .orderBy("date", "desc")
      .limit(limit);

    if (isIsoDate(date)) {
      query = db
        .collection("user_daily_scores")
        .where("date", "==", date)
        .orderBy("dailyScoreChange", "desc")
        .limit(limit);
    }

    const snapshot = await query.get();
    const items = (await Promise.all(snapshot.docs.map(toDailyScoreCard)))
      .filter((item): item is DailyScoreCard => item !== null)
      .sort((left, right) => {
        if (left.date !== right.date) {
          return right.date.localeCompare(left.date);
        }
        return right.dailyScoreChange - left.dailyScoreChange;
      });

    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch daily scores";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
