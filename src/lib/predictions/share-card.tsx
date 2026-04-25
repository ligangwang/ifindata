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

function Metric({ label, value, tone }: { label: string; value: string; tone?: "positive" | "negative" | "neutral" }) {
  const color = tone === "positive" ? "#34d399" : tone === "negative" ? "#fb7185" : "#bfdbfe";

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ color: "#94a3b8", fontSize: 24, fontWeight: 700 }}>{label}</div>
      <div style={{ color, fontSize: 58, fontWeight: 900, lineHeight: 1, marginTop: 8 }}>{value}</div>
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
  const returnTone =
    prediction.returnValue === null ? "neutral" : prediction.returnValue > 0 ? "positive" : prediction.returnValue < 0 ? "negative" : "neutral";
  const scoreTone =
    prediction.score === null ? "neutral" : prediction.score > 0 ? "positive" : prediction.score < 0 ? "negative" : "neutral";
  const authorMeta = prediction.authorLevel ? `${prediction.authorLabel} / Level ${Math.max(1, Math.floor(prediction.authorLevel))}` : prediction.authorLabel;

  return (
    <div
      style={{
        background: "#020617",
        color: "#f8fafc",
        display: "flex",
        height: "100%",
        position: "relative",
        width: "100%",
      }}
    >
      <div style={{ left: 58, position: "absolute", top: 42 }}>
        <Brand />
      </div>
      <div style={{ color: "#22d3ee", fontSize: 26, fontWeight: 800, position: "absolute", right: 58, top: 50 }}>
        Public Track Record
      </div>

      <div style={{ color: accent, fontSize: 28, fontWeight: 800, left: 58, position: "absolute", top: 126 }}>
        {directionText} stock call
      </div>
      <div style={{ color: accent, fontSize: 78, fontWeight: 900, left: 58, lineHeight: 1, position: "absolute", top: 170 }}>
        {isUp ? "UP" : "DOWN"}
      </div>
      <div style={{ color: "#cffafe", fontSize: 84, fontWeight: 900, left: 198, lineHeight: 1, position: "absolute", top: 166 }}>
        {formatTickerSymbol(prediction.ticker)}
      </div>
      <div style={{ color: "#e2e8f0", fontSize: 34, fontWeight: 700, left: 58, lineHeight: 1.25, position: "absolute", top: 278, width: 690 }}>
        {compactTitle(prediction.thesisTitle)}
      </div>

      <div style={{ position: "absolute", right: 72, top: 180 }}>
        <Metric
          label="Current return"
          value={prediction.returnValue === null ? "Pending" : formatReturnPercent(prediction.returnValue)}
          tone={returnTone}
        />
      </div>
      <div style={{ position: "absolute", right: 72, top: 342 }}>
        <Metric
          label="Score"
          value={prediction.score === null ? "Pending" : formatScore(prediction.score)}
          tone={scoreTone}
        />
      </div>

      <div style={{ bottom: 48, color: "#bae6fd", fontSize: 30, fontWeight: 700, left: 58, position: "absolute" }}>
        {authorMeta}
      </div>
      <div style={{ bottom: 50, color: "#94a3b8", fontSize: 26, fontWeight: 700, position: "absolute", right: 58 }}>
        {statusLabel(prediction.status)}
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
