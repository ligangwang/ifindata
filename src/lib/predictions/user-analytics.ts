import { FieldValue } from "firebase-admin/firestore";
import {
  computeLevel,
  computeSettledPredictionAnalytics,
  computeUserAnalytics,
  type SettledPredictionAnalytics,
  type UserAnalytics,
} from "@/lib/predictions/analytics";
import { isPredictionDirection } from "@/lib/predictions/types";

function finiteNumberOrNull(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function analyticsFromClosedPrediction(data: Record<string, unknown>): SettledPredictionAnalytics | null {
  if (!isPredictionDirection(data.direction)) {
    return null;
  }

  const entryPrice = finiteNumberOrNull(data.entryPrice);
  const result = data.result && typeof data.result === "object"
    ? data.result as Record<string, unknown>
    : {};
  const exitPrice = finiteNumberOrNull(result.exitPrice);

  if (entryPrice === null || entryPrice <= 0 || exitPrice === null) {
    return null;
  }

  return computeSettledPredictionAnalytics(data.direction, entryPrice, exitPrice);
}

export async function readUserAnalytics(
  db: FirebaseFirestore.Firestore,
  userId: string,
  stats: Record<string, unknown> = {},
): Promise<UserAnalytics> {
  const sourceStats = stats && typeof stats === "object" ? stats : {};
  const settledSnapshot = await db.collection("predictions")
    .where("userId", "==", userId)
    .where("status", "in", ["SETTLED", "CLOSED"])
    .get();
  const publicSettledDocs = settledSnapshot.docs.filter((doc) => doc.get("visibility") === "PUBLIC");
  const totalCalls = publicSettledDocs.length;
  const settledAnalytics = publicSettledDocs
    .map((doc) => analyticsFromClosedPrediction(doc.data() as Record<string, unknown>))
    .filter((analytics): analytics is SettledPredictionAnalytics => analytics !== null);
  const computed = computeUserAnalytics(totalCalls, settledAnalytics);
  const totalXP = Math.max(finiteNumberOrNull(sourceStats.totalXP) ?? 0, computed.totalXP);
  const level = Math.max(finiteNumberOrNull(sourceStats.level) ?? 1, computeLevel(totalXP));

  return {
    ...computed,
    totalXP,
    level,
  };
}

export async function recomputeUserAnalytics(
  db: FirebaseFirestore.Firestore,
  userId: string,
  nowIso: string,
): Promise<boolean> {
  const userSnapshot = await db.collection("users").doc(userId).get();

  if (!userSnapshot.exists) {
    return false;
  }

  const userData = userSnapshot.data() as Record<string, unknown>;
  const stats = (userData.stats as Record<string, unknown> | undefined) ?? {};
  const computed = await readUserAnalytics(db, userId, stats);

  await userSnapshot.ref.update({
    updatedAt: nowIso,
    "stats.totalCalls": computed.totalCalls,
    "stats.closedPredictions": computed.settledCalls,
    "stats.settledCalls": computed.settledCalls,
    "stats.totalScore": computed.score,
    "stats.totalXP": computed.totalXP,
    "stats.level": computed.level,
    "stats.avgPredictionScore": computed.avgPredictionScore,
    "stats.consistency": computed.consistency,
    "stats.coverage": computed.coverage,
    "stats.avgReturn": computed.avgReturn,
    "stats.winRate": computed.winRate,
    "stats.eligibleForLeaderboard": computed.eligibleForLeaderboard,
    "stats.statusLabel": FieldValue.delete(),
  });

  return true;
}
