import { getAdminFirestore } from "@/lib/firebase/admin";
import { NextRequest, NextResponse } from "next/server";
import { normalizeTicker, sanitizePredictionThesis, type Prediction } from "@/lib/predictions/types";

function parseLimit(raw: string | null): number {
  const parsed = Number(raw ?? "50");
  if (!Number.isFinite(parsed)) {
    return 50;
  }

  return Math.max(1, Math.min(100, Math.trunc(parsed)));
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await context.params;
  const normalizedTicker = normalizeTicker(symbol);
  const limit = parseLimit(request.nextUrl.searchParams.get("limit"));
  const db = getAdminFirestore();

  try {
    const snapshot = await db
      .collection("predictions")
      .where("ticker", "==", normalizedTicker)
      .where("visibility", "==", "PUBLIC")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    const items = snapshot.docs.map((doc) => {
      const data = doc.data() as Prediction;
      return {
        id: doc.id,
        ...data,
        thesis: sanitizePredictionThesis(data.thesis),
      };
    });

    return NextResponse.json({
      items,
      ticker: normalizedTicker,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch ticker predictions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
