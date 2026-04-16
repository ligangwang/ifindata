import { getAdminFirestore } from "@/lib/firebase/admin";
import { NextRequest, NextResponse } from "next/server";

type TickerSearchItem = {
  id: string;
  symbol: string;
  name: string;
  exchange: string | null;
  micCode: string | null;
  type: string | null;
};

type TickerDocument = {
  symbol?: unknown;
  symbolLower?: unknown;
  name?: unknown;
  nameLower?: unknown;
  exchange?: unknown;
  micCode?: unknown;
  type?: unknown;
  exchangePriority?: unknown;
};

function normalizeQuery(raw: string | null): string {
  return (raw ?? "").trim().replace(/^\$/, "").toLowerCase();
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function scoreTicker(item: TickerSearchItem & { symbolLower: string; nameLower: string; exchangePriority: number }, query: string): number {
  let score = item.exchangePriority;

  if (item.symbolLower === query) {
    score += 1000;
  } else if (item.symbolLower.startsWith(query)) {
    score += 700;
  }

  if (item.nameLower === query) {
    score += 500;
  } else if (item.nameLower.startsWith(query)) {
    score += 350;
  } else if (item.nameLower.split(/\s+/).some((token) => token.startsWith(query))) {
    score += 250;
  }

  return score;
}

function toSearchItem(id: string, data: TickerDocument) {
  const symbol = readString(data.symbol);
  const name = readString(data.name);

  if (!symbol || !name) {
    return null;
  }

  const symbolLower = readString(data.symbolLower) ?? symbol.toLowerCase();
  const nameLower = readString(data.nameLower) ?? name.toLowerCase();
  const exchangePriority = typeof data.exchangePriority === "number" ? data.exchangePriority : 0;

  return {
    id,
    symbol,
    symbolLower,
    name,
    nameLower,
    exchange: readString(data.exchange),
    micCode: readString(data.micCode),
    type: readString(data.type),
    exchangePriority,
  };
}

export async function GET(request: NextRequest) {
  const query = normalizeQuery(request.nextUrl.searchParams.get("q"));
  const limitParam = Number(request.nextUrl.searchParams.get("limit") ?? "10");
  const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(Math.trunc(limitParam), 20)) : 10;

  if (query.length === 0) {
    return NextResponse.json({ items: [] });
  }

  if (query.length > 32 || !/^[a-z0-9.\-\s]+$/.test(query)) {
    return NextResponse.json({ items: [] });
  }

  try {
    const db = getAdminFirestore();
    const prefixField = query.length === 1 ? "symbolPrefixes" : "searchPrefixes";
    const snapshot = await db
      .collection("tickers")
      .where("active", "==", true)
      .where("predictionSupported", "==", true)
      .where(prefixField, "array-contains", query)
      .limit(50)
      .get();

    const items = snapshot.docs
      .map((doc) => toSearchItem(doc.id, doc.data()))
      .filter((item): item is NonNullable<ReturnType<typeof toSearchItem>> => Boolean(item))
      .sort((left, right) => {
        const scoreDelta = scoreTicker(right, query) - scoreTicker(left, query);
        if (scoreDelta !== 0) {
          return scoreDelta;
        }
        return left.symbol.localeCompare(right.symbol);
      })
      .slice(0, limit)
      .map<TickerSearchItem>((item) => ({
        id: item.id,
        symbol: item.symbol,
        name: item.name,
        exchange: item.exchange,
        micCode: item.micCode,
        type: item.type,
      }));

    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to search tickers";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
