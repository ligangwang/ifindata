import { NextRequest, NextResponse } from "next/server";
import { getDecodedUserFromRequest } from "@/lib/firebase/auth";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { canonicalPredictionStatus } from "@/lib/predictions/types";

const MAX_HISTORY_POINTS = 1500;

function toFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function mapDailyMark(doc: FirebaseFirestore.QueryDocumentSnapshot) {
  const data = doc.data();
  const date = data.date;
  const close = toFiniteNumber(data.markPrice);

  if (!isIsoDate(date) || close === null || close <= 0) {
    return null;
  }

  return {
    date,
    close,
    returnValue: toFiniteNumber(data.markReturnValue),
    score: toFiniteNumber(data.markPredictionScore) ?? toFiniteNumber(data.markScore),
    status: canonicalPredictionStatus(data.status) ?? "OPEN",
  };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const db = getAdminFirestore();

  try {
    const predictionSnapshot = await db.collection("predictions").doc(id).get();
    if (!predictionSnapshot.exists) {
      return NextResponse.json({ error: "Prediction not found" }, { status: 404 });
    }

    const prediction = predictionSnapshot.data() as Record<string, unknown>;
    const userId = typeof prediction.userId === "string" ? prediction.userId : "";
    const visibility = prediction.visibility;
    const status = canonicalPredictionStatus(prediction.status);

    if (status === "CANCELED") {
      return NextResponse.json({ error: "Prediction not found" }, { status: 404 });
    }

    if (visibility !== "PUBLIC") {
      const decoded = await getDecodedUserFromRequest(request);
      if (!decoded || !userId || decoded.uid !== userId) {
        return NextResponse.json({ error: "Prediction not found" }, { status: 404 });
      }
    }

    const entryPrice = toFiniteNumber(prediction.entryPrice);
    const entryDate = isIsoDate(prediction.entryDate) ? prediction.entryDate : null;
    if (entryPrice === null || entryDate === null) {
      return NextResponse.json({
        entryDate,
        entryPrice,
        points: [],
        truncated: false,
      });
    }

    const snapshot = await db
      .collection("prediction_daily_marks")
      .where("predictionId", "==", id)
      .orderBy("date", "desc")
      .limit(MAX_HISTORY_POINTS + 1)
      .get();

    const mapped = snapshot.docs
      .map(mapDailyMark)
      .filter((point): point is NonNullable<ReturnType<typeof mapDailyMark>> => point !== null)
      .filter((point) => point.date >= entryDate);
    const truncated = mapped.length > MAX_HISTORY_POINTS;
    const points = (truncated ? mapped.slice(0, MAX_HISTORY_POINTS) : mapped).reverse();

    return NextResponse.json({
      entryDate,
      entryPrice,
      points,
      truncated,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load prediction price history";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
