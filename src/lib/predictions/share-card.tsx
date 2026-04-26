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
  authorNickname: string | null;
};

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

async function getShareCardPrediction(predictionId: string): Promise<ShareCardPrediction | null> {
  const db = getAdminFirestore();
  const snapshot = await db.collection("predictions").doc(predictionId).get();

  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data() as Record<string, unknown>;
  const visibility = typeof data.visibility === "string" ? data.visibility : "";
  const status = canonicalPredictionStatus(data.status);
  const ticker = typeof data.ticker === "string" ? normalizeTicker(data.ticker) : "";
  const direction = data.direction === "DOWN" ? "DOWN" : data.direction === "UP" ? "UP" : null;
  const thesisTitle = typeof data.thesisTitle === "string" ? data.thesisTitle.trim() : "";
  const userId = typeof data.userId === "string" ? data.userId.trim() : "";

  if (visibility !== "PUBLIC" || status === null || status === "CANCELED" || !ticker || !direction) {
    return null;
  }

  let authorNickname: string | null = null;
  if (userId) {
    const userSnapshot = await db.collection("users").doc(userId).get();
    const userData = userSnapshot.data() as Record<string, unknown> | undefined;
    const nickname = typeof userData?.nickname === "string" ? userData.nickname.trim() : "";
    authorNickname = nickname ? `@${nickname}` : null;
  }

  return {
    ticker,
    direction,
    thesisTitle,
    status,
    authorNickname,
  };
}

function statusLabel(status: PredictionStatus): string {
  if (status === "CREATED") {
    return "Awaiting entry";
  }
  if (status === "OPEN") {
    return "Live";
  }
  if (status === "CLOSING") {
    return "Closing";
  }
  if (status === "SETTLED") {
    return "Settled";
  }
  return "Canceled";
}

function shareCardImage(prediction: ShareCardPrediction) {
  const directionLabel = prediction.direction === "DOWN" ? "Bearish" : "Bullish";
  const title = prediction.thesisTitle || `${directionLabel} call on ${prediction.ticker}`;

  return (
    <div
      style={{
        alignItems: "flex-start",
        background: "#020617",
        color: "#e0f2fe",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        justifyContent: "space-between",
        padding: "56px 64px",
        width: "100%",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <Brand />
      </div>
      <div style={{ display: "flex", flexDirection: "column", maxWidth: "1000px" }}>
        <div style={{ color: "#38bdf8", display: "flex", fontSize: 34, fontWeight: 700 }}>
          {`${directionLabel} ${prediction.ticker}`}
        </div>
        <div style={{ color: "#f8fafc", display: "flex", fontSize: 54, fontWeight: 700, marginTop: 22 }}>
          {title}
        </div>
        <div style={{ color: "#cbd5e1", display: "flex", fontSize: 30, marginTop: 28 }}>
          {`Status: ${statusLabel(prediction.status)}`}
        </div>
        {prediction.authorNickname ? (
          <div style={{ color: "#94a3b8", display: "flex", fontSize: 28, marginTop: 18 }}>
            {prediction.authorNickname}
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
