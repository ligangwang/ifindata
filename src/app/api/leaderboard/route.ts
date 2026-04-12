import { getAdminFirestore } from "@/lib/firebase/admin";
import { NextRequest, NextResponse } from "next/server";

type LeaderboardUser = {
  userId: string;
  displayName: string | null;
  photoURL: string | null;
  totalScore: number;
  settledPredictions: number;
};

function asNumber(value: unknown): number {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function parseLimit(raw: string | null): number {
  const parsed = Number(raw ?? "50");
  if (!Number.isFinite(parsed)) {
    return 50;
  }

  return Math.max(1, Math.min(100, Math.trunc(parsed)));
}

function parseMinSettled(raw: string | null): number {
  const parsed = Number(raw ?? "5");
  if (!Number.isFinite(parsed)) {
    return 5;
  }

  return Math.max(0, Math.trunc(parsed));
}

export async function GET(request: NextRequest) {
  const db = getAdminFirestore();
  const limit = parseLimit(request.nextUrl.searchParams.get("limit"));
  const minSettled = parseMinSettled(request.nextUrl.searchParams.get("minSettled"));

  try {
    const snapshot = await db
      .collection("users")
      .orderBy("stats.totalScore", "desc")
      .limit(Math.max(100, limit * 4))
      .get();

    const users: LeaderboardUser[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data() as Record<string, unknown>;
      const stats = (data.stats as Record<string, unknown> | undefined) ?? {};
      const settledPredictions = asNumber(stats.settledPredictions);
      const totalScore = asNumber(stats.totalScore);

      if (settledPredictions < minSettled) {
        continue;
      }

      users.push({
        userId: doc.id,
        displayName: (data.displayName as string | null | undefined) ?? null,
        photoURL: (data.photoURL as string | null | undefined) ?? null,
        totalScore,
        settledPredictions,
      });

      if (users.length >= limit) {
        break;
      }
    }

    users.sort((a, b) => {
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }
      return b.settledPredictions - a.settledPredictions;
    });

    return NextResponse.json({
      items: users,
      minSettled,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch leaderboard";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
