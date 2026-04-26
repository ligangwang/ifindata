import { ImageResponse } from "next/og";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { canonicalPredictionStatus, normalizeTicker, type PredictionDirection, type PredictionStatus } from "@/lib/predictions/types";

export const predictionShareCardSize = {
  width: 1200,
  height: 630,
};

export const predictionShareCardContentType = "image/png";

type ShareCardPrediction = {
  ticker: string;
  direction: PredictionDirection;
  thesisTitle: string;
  status: PredictionStatus;
  authorLabel: string;
  authorLevel: number | null;
  returnValue: number | null;
  score: number | null;
};

function isPublicProfile(data: Record<string, unknown> | undefined): boolean {
  const settings = data?.settings;
  if (!settings || typeof settings !== "object") {
    return true;
  }

  return (settings as Record<string, unknown>).isPublic !== false;
}

function numberFromStats(stats: Record<string, unknown>, key: string): number | null {
  const value = stats[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

async function getShareCardPrediction(predictionId: string): Promise<ShareCardPrediction | null> {
  const db = getAdminFirestore();
  const snapshot = await db.collection("predictions").doc(predictionId).get();
  if (!snapshot.exists) {
    return null;
  }

  const prediction = snapshot.data() as Record<string, unknown>;
  const status = canonicalPredictionStatus(prediction.status);
  if (prediction.visibility !== "PUBLIC" || !status || status === "CANCELED") {
    return null;
  }

  const ticker = normalizeTicker(typeof prediction.ticker === "string" ? prediction.ticker : "");
  if (!ticker) {
    return null;
  }

  const direction = prediction.direction === "DOWN" ? "DOWN" : "UP";
  const thesisTitle = typeof prediction.thesisTitle === "string" ? prediction.thesisTitle : "";
  const userId = typeof prediction.userId === "string" ? prediction.userId.trim() : "";
  const result = prediction.result && typeof prediction.result === "object"
    ? prediction.result as Record<string, unknown>
    : null;
  const returnValue =
    typeof result?.returnValue === "number" && Number.isFinite(result.returnValue)
      ? result.returnValue
      : typeof prediction.markReturnValue === "number" && Number.isFinite(prediction.markReturnValue)
        ? prediction.markReturnValue
        : null;
  const score =
    typeof result?.predictionScore === "number" && Number.isFinite(result.predictionScore)
      ? result.predictionScore
      : typeof result?.score === "number" && Number.isFinite(result.score)
        ? result.score
        : typeof prediction.markPredictionScore === "number" && Number.isFinite(prediction.markPredictionScore)
          ? prediction.markPredictionScore
          : typeof prediction.markScore === "number" && Number.isFinite(prediction.markScore)
            ? prediction.markScore
            : null;

  let authorLabel = "YouAnalyst analyst";
  let authorLevel: number | null = null;
  if (userId) {
    const userSnapshot = await db.collection("users").doc(userId).get();
    const userData = userSnapshot.data() as Record<string, unknown> | undefined;
    const nickname = typeof userData?.nickname === "string" ? userData.nickname.trim() : "";
    const stats = userData?.stats && typeof userData.stats === "object"
      ? userData.stats as Record<string, unknown>
      : {};

    authorLabel = nickname ? `@${nickname}` : "YouAnalyst analyst";
    authorLevel = isPublicProfile(userData) ? numberFromStats(stats, "level") : null;
  }

  return {
    ticker,
    direction,
    thesisTitle,
    status,
    authorLabel,
    authorLevel,
    returnValue,
    score,
  };
}

function Brand() {
  return (
    <div style={{ display: "flex", alignItems: "center", fontSize: 34, fontWeight: 800, color: "#f8fafc" }}>
      You<span style={{ color: "#22c55e" }}>Analyst</span>
    </div>
  );
}

function fallbackImage() {
  return (
    <div
      style={{
        alignItems: "center",
        background: "#020617",
        color: "#e0f2fe",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <Brand />
      <div style={{ color: "#94a3b8", fontSize: 30, marginTop: 28 }}>Public prediction unavailable</div>
    </div>
  );
}

export async function createPredictionShareImage(predictionId: string): Promise<ImageResponse> {
  try {
    await getShareCardPrediction(predictionId);
  } catch {
    // Ignore lookup failures and fall back to the safe default share card.
  }

  return new ImageResponse(fallbackImage(), predictionShareCardSize);
}
