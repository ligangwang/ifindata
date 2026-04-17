import { getAdminFirestore } from "@/lib/firebase/admin";
import { NextRequest, NextResponse } from "next/server";

type DailyUserGainer = {
  userId: string;
  displayName: string | null;
  nickname: string | null;
  photoURL: string | null;
  totalScore: number;
  dailyScoreChange: number;
  dailyMarkedPredictions: number;
};

type DailyPredictionGainer = {
  predictionId: string;
  userId: string;
  displayName: string | null;
  nickname: string | null;
  ticker: string | null;
  direction: string | null;
  score: number;
  scoreChange: number;
  status: string | null;
};

function asNumber(value: unknown): number {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isIsoDate(value: string | null): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

async function readUserProfile(userId: string): Promise<{
  displayName: string | null;
  nickname: string | null;
  photoURL: string | null;
}> {
  const snapshot = await getAdminFirestore().collection("users").doc(userId).get();
  const data = (snapshot.data() ?? {}) as Record<string, unknown>;

  return {
    displayName: asString(data.displayName),
    nickname: asString(data.nickname),
    photoURL: asString(data.photoURL),
  };
}

async function latestDailyScoreDate(): Promise<string | null> {
  const snapshot = await getAdminFirestore()
    .collection("user_daily_scores")
    .orderBy("date", "desc")
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  return asString(snapshot.docs[0].get("date"));
}

async function topUserGainers(date: string): Promise<DailyUserGainer[]> {
  const snapshot = await getAdminFirestore()
    .collection("user_daily_scores")
    .where("date", "==", date)
    .orderBy("dailyScoreChange", "desc")
    .limit(3)
    .get();

  return Promise.all(snapshot.docs.map(async (doc) => {
    const data = doc.data() as Record<string, unknown>;
    const userId = asString(data.userId) ?? doc.id.split("_")[0] ?? "";
    const profile = userId ? await readUserProfile(userId) : { displayName: null, nickname: null, photoURL: null };

    return {
      userId,
      ...profile,
      totalScore: asNumber(data.totalScore),
      dailyScoreChange: asNumber(data.dailyScoreChange),
      dailyMarkedPredictions: asNumber(data.dailyMarkedPredictions),
    };
  }));
}

async function topPredictionGainers(date: string): Promise<DailyPredictionGainer[]> {
  const snapshot = await getAdminFirestore()
    .collection("prediction_daily_marks")
    .where("date", "==", date)
    .orderBy("scoreChange", "desc")
    .limit(3)
    .get();

  return Promise.all(snapshot.docs.map(async (doc) => {
    const data = doc.data() as Record<string, unknown>;
    const predictionId = asString(data.predictionId) ?? doc.id.split("_")[0] ?? "";
    const userId = asString(data.userId) ?? "";
    const profile = userId ? await readUserProfile(userId) : { displayName: null, nickname: null, photoURL: null };

    return {
      predictionId,
      userId,
      ...profile,
      ticker: asString(data.ticker),
      direction: asString(data.direction),
      score: asNumber(data.score),
      scoreChange: asNumber(data.scoreChange),
      status: asString(data.status),
    };
  }));
}

export async function GET(request: NextRequest) {
  try {
    const requestedDate = request.nextUrl.searchParams.get("date");
    const date = isIsoDate(requestedDate) ? requestedDate : await latestDailyScoreDate();

    if (!date) {
      return NextResponse.json({
        date: null,
        userGainers: [],
        predictionGainers: [],
      });
    }

    const [userGainers, predictionGainers] = await Promise.all([
      topUserGainers(date),
      topPredictionGainers(date),
    ]);

    return NextResponse.json({
      date,
      userGainers,
      predictionGainers,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch daily scores";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
