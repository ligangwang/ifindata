import { getAdminFirestore } from "@/lib/firebase/admin";
import { NextRequest, NextResponse } from "next/server";

type DailyCallHighlight = {
  predictionId: string;
  userId: string;
  displayName: string | null;
  nickname: string | null;
  ticker: string | null;
  direction: "UP" | "DOWN" | null;
  dailyScoreChange: number;
  totalScore: number;
  returnSinceEntry: number | null;
  status: "LIVE" | "SETTLED";
  createdAt: string;
};

type UserProfileSummary = {
  displayName: string | null;
  nickname: string | null;
};

const TOP_CALL_LIMIT = 10;
const CANDIDATE_LIMIT = 25;

function asNumber(value: unknown): number {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function asNumberOrNull(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isIsoDate(value: string | null): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function directionValue(value: unknown): "UP" | "DOWN" | null {
  return value === "UP" || value === "DOWN" ? value : null;
}

function statusValue(value: unknown): "LIVE" | "SETTLED" {
  return value === "CLOSED" ? "SETTLED" : "LIVE";
}

async function latestDailyScoreDate(): Promise<string | null> {
  const snapshot = await getAdminFirestore()
    .collection("prediction_daily_marks")
    .orderBy("date", "desc")
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  return asString(snapshot.docs[0].get("date"));
}

async function readUserProfile(userId: string): Promise<UserProfileSummary> {
  const snapshot = await getAdminFirestore().collection("users").doc(userId).get();
  const data = (snapshot.data() ?? {}) as Record<string, unknown>;

  return {
    displayName: asString(data.displayName),
    nickname: asString(data.nickname),
  };
}

async function readPredictionCreatedAt(predictionId: string): Promise<string> {
  if (!predictionId) {
    return "";
  }

  const snapshot = await getAdminFirestore().collection("predictions").doc(predictionId).get();
  return asString(snapshot.get("createdAt")) ?? "";
}

async function topDailyCallCandidates(
  date: string,
  order: "desc" | "asc",
): Promise<FirebaseFirestore.QueryDocumentSnapshot[]> {
  const snapshot = await getAdminFirestore()
    .collection("prediction_daily_marks")
    .where("date", "==", date)
    .orderBy("scoreChange", order)
    .limit(CANDIDATE_LIMIT)
    .get();

  return snapshot.docs;
}

async function topDailyCalls(date: string): Promise<DailyCallHighlight[]> {
  const [positiveCandidates, negativeCandidates] = await Promise.all([
    topDailyCallCandidates(date, "desc"),
    topDailyCallCandidates(date, "asc"),
  ]);
  const docsById = new Map<string, FirebaseFirestore.QueryDocumentSnapshot>();

  for (const doc of [...positiveCandidates, ...negativeCandidates]) {
    docsById.set(doc.id, doc);
  }

  const calls = await Promise.all(Array.from(docsById.values()).map(async (doc) => {
    const data = doc.data() as Record<string, unknown>;
    const predictionId = asString(data.predictionId) ?? doc.id.split("_")[0] ?? "";
    const userId = asString(data.userId) ?? "";
    const [profile, createdAt] = await Promise.all([
      userId ? readUserProfile(userId) : Promise.resolve({ displayName: null, nickname: null }),
      readPredictionCreatedAt(predictionId),
    ]);

    return {
      predictionId,
      userId,
      ...profile,
      ticker: asString(data.ticker),
      direction: directionValue(data.direction),
      dailyScoreChange: asNumber(data.scoreChange),
      totalScore: asNumber(data.score),
      returnSinceEntry: asNumberOrNull(data.markDisplayPercent),
      status: statusValue(data.status),
      createdAt,
    };
  }));

  return calls
    .filter((call) => call.predictionId && call.dailyScoreChange !== 0)
    .sort((a, b) => {
      const positiveDelta = Number(b.dailyScoreChange > 0) - Number(a.dailyScoreChange > 0);
      if (positiveDelta !== 0) {
        return positiveDelta;
      }

      const positiveSort = b.dailyScoreChange - a.dailyScoreChange;
      const fallbackSort = Math.abs(b.dailyScoreChange) - Math.abs(a.dailyScoreChange);
      const scoreSort = b.totalScore - a.totalScore;
      const createdSort = a.createdAt.localeCompare(b.createdAt);

      return (a.dailyScoreChange > 0 || b.dailyScoreChange > 0 ? positiveSort : fallbackSort) ||
        scoreSort ||
        createdSort ||
        a.predictionId.localeCompare(b.predictionId);
    })
    .slice(0, TOP_CALL_LIMIT);
}

export async function GET(request: NextRequest) {
  try {
    const requestedDate = request.nextUrl.searchParams.get("date");
    const date = isIsoDate(requestedDate) ? requestedDate : await latestDailyScoreDate();

    if (!date) {
      return NextResponse.json({
        date: null,
        callOfTheDay: null,
        topCalls: [],
      });
    }

    const topCalls = await topDailyCalls(date);

    return NextResponse.json({
      date,
      callOfTheDay: topCalls[0] ?? null,
      topCalls,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch daily scores";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
