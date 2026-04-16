import { getAdminFirestore } from "@/lib/firebase/admin";
import { NextRequest, NextResponse } from "next/server";

type LeaderboardUser = {
  userId: string;
  displayName: string | null;
  photoURL: string | null;
  totalScore: number;
  closedPredictions: number;
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

export async function GET(request: NextRequest) {
  const db = getAdminFirestore();
  const limit = parseLimit(request.nextUrl.searchParams.get("limit"));

  try {
    const snapshot = await db
      .collection("users")
      .orderBy("stats.totalScore", "desc")
      .limit(limit)
      .get();

    const users: LeaderboardUser[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data() as Record<string, unknown>;
      const stats = (data.stats as Record<string, unknown> | undefined) ?? {};
      const closedPredictions = asNumber(stats.closedPredictions);
      const totalScore = asNumber(stats.totalScore);

      users.push({
        userId: doc.id,
        displayName: (data.displayName as string | null | undefined) ?? null,
        photoURL: (data.photoURL as string | null | undefined) ?? null,
        totalScore,
        closedPredictions,
      });
    }

    users.sort((a, b) => b.totalScore - a.totalScore);

    return NextResponse.json({
      items: users,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch leaderboard";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
