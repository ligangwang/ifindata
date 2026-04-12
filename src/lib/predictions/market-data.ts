export type MarketQuote = {
  ticker: string;
  price: number;
  source: string;
  capturedAt: string;
};

function parseStaticPriceMap(): Record<string, number> {
  const raw = process.env.MARKET_DATA_STATIC_PRICES;
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const output: Record<string, number> = {};

    for (const [ticker, value] of Object.entries(parsed)) {
      if (typeof value === "number" && Number.isFinite(value) && value > 0) {
        output[ticker.toUpperCase()] = value;
      }
    }

    return output;
  } catch {
    return {};
  }
}

function fallbackPrice(): number | null {
  const raw = process.env.MARKET_DATA_FALLBACK_PRICE;
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

export async function getLatestPrice(ticker: string): Promise<MarketQuote> {
  const normalizedTicker = ticker.trim().toUpperCase();
  const staticMap = parseStaticPriceMap();
  const now = new Date().toISOString();

  if (staticMap[normalizedTicker]) {
    return {
      ticker: normalizedTicker,
      price: staticMap[normalizedTicker],
      source: "static-env",
      capturedAt: now,
    };
  }

  const fallback = fallbackPrice();
  if (fallback) {
    return {
      ticker: normalizedTicker,
      price: fallback,
      source: "fallback-env",
      capturedAt: now,
    };
  }

  throw new Error(
    "Market data provider not configured. Set MARKET_DATA_STATIC_PRICES or MARKET_DATA_FALLBACK_PRICE.",
  );
}