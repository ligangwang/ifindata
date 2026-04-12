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

function isMissingIndexError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const code =
    typeof error === "object" && error && "code" in error
      ? (error as { code?: unknown }).code
      : undefined;

  return (
    code === 9 ||
    /requires an index|failed precondition|query requires an index/i.test(error.message)
  );
}

function mapPredictionDoc(doc: FirebaseFirestore.QueryDocumentSnapshot) {
  const data = doc.data() as Prediction;

  return {
    id: doc.id,
    ...data,
    thesis: sanitizePredictionThesis(data.thesis),
  };
}

async function listTickerPredictions(
  db: FirebaseFirestore.Firestore,
  ticker: string,
  limit: number,
) {
  try {
    const snapshot = await db
      .collection("predictions")
      .where("ticker", "==", ticker)
      .where("visibility", "==", "PUBLIC")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    return snapshot.docs.map(mapPredictionDoc);
  } catch (error) {
    if (!isMissingIndexError(error)) {
      throw error;
    }

    const items: ReturnType<typeof mapPredictionDoc>[] = [];
    const batchSize = Math.max(limit, 50);
    let cursor: FirebaseFirestore.QueryDocumentSnapshot | undefined;

    while (items.length < limit) {
      let query = db.collection("predictions").orderBy("createdAt", "desc").limit(batchSize);

      if (cursor) {
        query = query.startAfter(cursor);
      }

      const snapshot = await query.get();
      if (snapshot.empty) {
        break;
      }

      for (const doc of snapshot.docs) {
        const data = doc.data() as Record<string, unknown>;
        if (data.ticker === ticker && data.visibility === "PUBLIC") {
          items.push(mapPredictionDoc(doc));
        }

        if (items.length >= limit) {
          break;
        }
      }

      cursor = snapshot.docs[snapshot.docs.length - 1];
      if (snapshot.docs.length < batchSize) {
        break;
      }
    }

    return items;
  }
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
    const items = await listTickerPredictions(db, normalizedTicker, limit);

    return NextResponse.json({
      items,
      ticker: normalizedTicker,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch ticker predictions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
