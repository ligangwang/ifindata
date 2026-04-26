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

function formatTickerSymbol(ticker: string): string {
  return ticker.startsWith("$") ? ticker : `$${ticker}`;
}

function formatReturnPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${(value * 100).toFixed(1)}%`;
}

function formatScore(value: number): string {
  const rounded = Math.round(value);
  return `${rounded > 0 ? "+" : ""}${rounded}`;
}

function statusLabel(status: PredictionStatus): string {
  switch (status) {
    case "CREATED":
      return "Awaiting entry";
    case "OPEN":
      return "Live";
    case "CLOSING":
      return "Settles at next close";
    case "SETTLED":
      return "Settled";
    case "CANCELED":
      return "Canceled";
  }
}

function compactTitle(value: string): string {
  const title = value.trim() || "Public stock prediction";
  return title.length > 92 ? `${title.slice(0, 89).trimEnd()}...` : title;
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

function shareCardImage(prediction: ShareCardPrediction) {
  const isUp = prediction.direction === "UP";
  const accent = isUp ? "#67e8f9" : "#fda4af";
  const directionText = isUp ? "Bullish" : "Bearish";
  const returnColor =
    prediction.returnValue === null ? "#bfdbfe" : prediction.returnValue > 0 ? "#34d399" : prediction.returnValue < 0 ? "#fb7185" : "#bfdbfe";
  const scoreColor =
    prediction.score === null ? "#bfdbfe" : prediction.score > 0 ? "#34d399" : prediction.score < 0 ? "#fb7185" : "#bfdbfe";
  const authorMeta = prediction.authorLevel ? `${prediction.authorLabel} / Level ${Math.max(1, Math.floor(prediction.authorLevel))}` : prediction.authorLabel;
  const returnValue = prediction.returnValue === null ? "Pending" : formatReturnPercent(prediction.returnValue);
  const scoreValue = prediction.score === null ? "Pending" : formatScore(prediction.score);

  return (
    <div
      style={{
        alignItems: "flex-start",
        background: "#020617",
        color: "#f8fafc",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        padding: "42px 52px",
        width: "100%",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
        <Brand />
        <div style={{ color: "#22d3ee", fontSize: 24, fontWeight: 800 }}>Public Track Record</div>
      </div>

      <div style={{ color: accent, fontSize: 28, fontWeight: 800, marginTop: 42 }}>
        {directionText} stock call
      </div>
      <div style={{ display: "flex", marginTop: 18 }}>
        <div style={{ color: accent, fontSize: 74, fontWeight: 900, lineHeight: 1 }}>{isUp ? "UP" : "DOWN"}</div>
        <div style={{ color: "#cffafe", fontSize: 80, fontWeight: 900, lineHeight: 1, marginLeft: 28 }}>
          {formatTickerSymbol(prediction.ticker)}
        </div>
      </div>

      <div style={{ color: "#e2e8f0", fontSize: 34, fontWeight: 700, lineHeight: 1.25, marginTop: 28, maxWidth: 720 }}>
        {compactTitle(prediction.thesisTitle)}
      </div>

      <div style={{ display: "flex", flexDirection: "column", marginTop: 48 }}>
        <div style={{ color: "#bae6fd", fontSize: 30, fontWeight: 700 }}>{authorMeta}</div>
        <div style={{ color: "#94a3b8", fontSize: 26, fontWeight: 700, marginTop: 18 }}>{statusLabel(prediction.status)}</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", marginTop: 40 }}>
        <div style={{ color: "#94a3b8", fontSize: 24, fontWeight: 700 }}>Current return</div>
        <div style={{ color: returnColor, fontSize: 58, fontWeight: 900, lineHeight: 1, marginTop: 8 }}>{returnValue}</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", marginTop: 28 }}>
        <div style={{ color: "#94a3b8", fontSize: 24, fontWeight: 700 }}>Score</div>
        <div style={{ color: scoreColor, fontSize: 58, fontWeight: 900, lineHeight: 1, marginTop: 8 }}>{scoreValue}</div>
      </div>
    </div>
  );
}

export async function createPredictionShareImage(predictionId: string): Promise<ImageResponse> {
  let prediction: ShareCardPrediction | null = null;

  try {
    prediction = await getShareCardPrediction(predictionId);
  } catch {
    prediction = null;
  }

  return new ImageResponse(prediction ? shareCardImage(prediction) : fallbackImage(), predictionShareCardSize);
}
