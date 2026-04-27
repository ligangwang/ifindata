import { ImageResponse } from "next/og";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { normalizeTicker, type PredictionDirection } from "@/lib/predictions/types";

export const predictionShareCardSize = {
  width: 1200,
  height: 630,
};

export const predictionShareCardContentType = "image/png";

type ShareCardPrediction = {
  ticker: string;
  direction: PredictionDirection;
  thesisTitle: string;
  entryDate: string | null;
  markPriceDate: string | null;
  returnValue: number | null;
};

function Brand() {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", fontSize: 34, fontWeight: 800, color: "#f8fafc" }}>
        You<span style={{ color: "#22c55e" }}>Analyst</span>
      </div>
      <div style={{ color: "#94a3b8", display: "flex", fontSize: 18, marginTop: 8 }}>
        Your watchlist. Your track record.
      </div>
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

async function getShareCardPrediction(predictionId: string): Promise<ShareCardPrediction | null> {
  const db = getAdminFirestore();
  const snapshot = await db.collection("predictions").doc(predictionId).get();

  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data() as Record<string, unknown>;
  const visibility = typeof data.visibility === "string" ? data.visibility : "";
  const ticker = typeof data.ticker === "string" ? normalizeTicker(data.ticker) : "";
  const direction = data.direction === "DOWN" ? "DOWN" : data.direction === "UP" ? "UP" : null;
  const thesisTitle = typeof data.thesisTitle === "string" ? data.thesisTitle.trim() : "";
  const entryDate = typeof data.entryDate === "string" ? data.entryDate : null;
  const markPriceDate = typeof data.markPriceDate === "string" ? data.markPriceDate : null;
  const markReturnValue =
    typeof data.markReturnValue === "number" && Number.isFinite(data.markReturnValue) ? data.markReturnValue : null;
  const result = data.result && typeof data.result === "object" ? data.result as Record<string, unknown> : null;
  const settledReturnValue =
    result && typeof result.returnValue === "number" && Number.isFinite(result.returnValue) ? result.returnValue : null;

  if (visibility !== "PUBLIC" || !ticker || !direction) {
    return null;
  }

  return {
    ticker,
    direction,
    thesisTitle,
    entryDate,
    markPriceDate,
    returnValue: settledReturnValue ?? markReturnValue,
  };
}

function formatReturnPercent(returnValue: number): string {
  const percent = returnValue * 100;
  const sign = percent > 0 ? "+" : "";
  return `${sign}${percent.toFixed(2)}%`;
}

function parseDateOnly(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }

  const [dateOnly] = value.split("T");
  const timestamp = Date.parse(`${dateOnly}T00:00:00.000Z`);
  return Number.isNaN(timestamp) ? null : timestamp;
}

function daysSinceCall(entryDate: string | null, markPriceDate: string | null): number | null {
  const entryTimestamp = parseDateOnly(entryDate);
  const markTimestamp = parseDateOnly(markPriceDate);
  if (entryTimestamp === null || markTimestamp === null) {
    return null;
  }

  return Math.max(0, Math.floor((markTimestamp - entryTimestamp) / (24 * 60 * 60 * 1000)));
}

function returnLabel(prediction: ShareCardPrediction): string | null {
  if (typeof prediction.returnValue !== "number") {
    return null;
  }

  const formattedReturn = formatReturnPercent(prediction.returnValue);
  const elapsedDays = daysSinceCall(prediction.entryDate, prediction.markPriceDate);
  return elapsedDays === null ? formattedReturn : `${formattedReturn} (${elapsedDays}d)`;
}

function returnToneColor(returnValue: number): string {
  if (returnValue > 0) {
    return "#6ee7b7";
  }
  if (returnValue < 0) {
    return "#fda4af";
  }
  return "#cbd5e1";
}

function shareCardImage(prediction: ShareCardPrediction) {
  const directionLabel = prediction.direction === "DOWN" ? "Bearish" : "Bullish";
  const hasCustomTitle = Boolean(prediction.thesisTitle);
  const title = hasCustomTitle ? prediction.thesisTitle : `${directionLabel} ${prediction.ticker}`;
  const shareReturn = returnLabel(prediction);
  const shareReturnColor =
    typeof prediction.returnValue === "number" ? returnToneColor(prediction.returnValue) : "#cbd5e1";

  return (
    <div
      style={{
        alignItems: "flex-start",
        background: "#020617",
        color: "#e0f2fe",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        justifyContent: "flex-start",
        padding: "56px 64px",
        width: "100%",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <Brand />
      </div>
      <div style={{ display: "flex", flexDirection: "column", marginTop: 104, maxWidth: "1000px" }}>
        {hasCustomTitle ? (
          <div style={{ color: "#38bdf8", display: "flex", fontSize: 34, fontWeight: 700 }}>
            {`${directionLabel} ${prediction.ticker}`}
          </div>
        ) : null}
        <div style={{ color: "#f8fafc", display: "flex", fontSize: 54, fontWeight: 700, marginTop: 22 }}>
          {title}
        </div>
        {shareReturn ? (
          <div style={{ alignItems: "baseline", display: "flex", fontSize: 30, gap: 12, marginTop: 28 }}>
            <div style={{ color: "#cbd5e1", display: "flex" }}>
              Return:
            </div>
            <div style={{ color: shareReturnColor, display: "flex" }}>
              {shareReturn}
            </div>
          </div>
        ) : null}
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
