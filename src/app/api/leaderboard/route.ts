import { getAdminFirestore } from "@/lib/firebase/admin";
import { LEADERBOARD_MIN_CALLS } from "@/lib/predictions/analytics";
import { readUserAnalytics } from "@/lib/predictions/user-analytics";
import { NextRequest, NextResponse } from "next/server";

type LeaderboardUser = {
  userId: string;
  displayName: string | null;
  nickname: string | null;
  photoURL: string | null;
  totalScore: number;
  settledCalls: number;
  liveCalls: number;
  avgReturn: number;
  totalXP: number;
  level: number;
};

const LEADERBOARD_CANDIDATE_MULTIPLIER = 5;
const EMERGING_ANALYST_LIMIT = 10;
const EMERGING_CANDIDATE_LIMIT = 50;

function parseLimit(raw: string | null): number {
  const parsed = Number(raw ?? "50");
  if (!Number.isFinite(parsed)) {
    return 50;
  }

  return Math.max(1, Math.min(100, Math.trunc(parsed)));
}

function numberFromStats(stats: Record<string, unknown>, key: string): number {
  const parsed = Number(stats[key]);
  return Number.isFinite(parsed) ? parsed : 0;
}

function liveCallsFromStats(stats: Record<string, unknown>): number {
  return numberFromStats(stats, "openingPredictions") +
    numberFromStats(stats, "openPredictions") +
    numberFromStats(stats, "closingPredictions");
}

function userFromStats(doc: FirebaseFirestore.QueryDocumentSnapshot): LeaderboardUser {
  const data = doc.data() as Record<string, unknown>;
  const stats = (data.stats as Record<string, unknown> | undefined) ?? {};
  const settledCalls = numberFromStats(stats, "settledCalls") || numberFromStats(stats, "closedPredictions");

  return {
    userId: doc.id,
    displayName: (data.displayName as string | null | undefined) ?? null,
    nickname: typeof data.nickname === "string" && data.nickname.trim() ? data.nickname.trim() : null,
    photoURL: (data.photoURL as string | null | undefined) ?? null,
    totalScore: numberFromStats(stats, "totalScore"),
    settledCalls,
    liveCalls: liveCallsFromStats(stats),
    avgReturn: numberFromStats(stats, "avgReturn"),
    totalXP: numberFromStats(stats, "totalXP"),
    level: numberFromStats(stats, "level") || 1,
  };
}

export async function GET(request: NextRequest) {
  const db = getAdminFirestore();
  const limit = parseLimit(request.nextUrl.searchParams.get("limit"));
  const candidateLimit = limit * LEADERBOARD_CANDIDATE_MULTIPLIER;

  try {
    const [snapshot, emergingSnapshot] = await Promise.all([
      db
        .collection("users")
        .orderBy("stats.totalScore", "desc")
        .limit(candidateLimit)
        .get(),
      db
        .collection("users")
        .orderBy("stats.settledCalls", "desc")
        .limit(EMERGING_CANDIDATE_LIMIT)
        .get(),
    ]);

    const users: LeaderboardUser[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data() as Record<string, unknown>;
      const stats = (data.stats as Record<string, unknown> | undefined) ?? {};
      const analytics = await readUserAnalytics(db, doc.id, stats);
      const totalScore = analytics.score;
      const settledCalls = analytics.settledCalls;
      const user = {
        userId: doc.id,
        displayName: (data.displayName as string | null | undefined) ?? null,
        nickname: typeof data.nickname === "string" && data.nickname.trim() ? data.nickname.trim() : null,
        photoURL: (data.photoURL as string | null | undefined) ?? null,
        totalScore,
        settledCalls,
        liveCalls: liveCallsFromStats(stats),
        avgReturn: analytics.avgReturn,
        totalXP: analytics.totalXP,
        level: analytics.level,
      };

      if (settledCalls < LEADERBOARD_MIN_CALLS) {
        continue;
      }

      users.push(user);
    }

    users.sort((a, b) =>
      b.totalScore - a.totalScore ||
      b.settledCalls - a.settledCalls ||
      b.avgReturn - a.avgReturn,
    );
    const emergingUsers = emergingSnapshot.docs
      .map(userFromStats)
      .filter((user) =>
        user.settledCalls < LEADERBOARD_MIN_CALLS &&
        (user.settledCalls > 0 || user.liveCalls > 0)
      )
      .sort((a, b) =>
        b.settledCalls - a.settledCalls ||
        b.liveCalls - a.liveCalls ||
        b.totalScore - a.totalScore ||
        b.avgReturn - a.avgReturn,
      );

    return NextResponse.json({
      items: users.slice(0, limit),
      emergingItems: emergingUsers.slice(0, EMERGING_ANALYST_LIMIT),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch leaderboard";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
