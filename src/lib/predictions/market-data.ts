export type MarketQuote = {
  ticker: string;
  price: number;
  source: string;
  capturedAt: string;
};

type FinnhubQuoteResponse = {
  c?: number;
  t?: number;
};

function getFinnhubConfig(): {
  apiKey: string;
  apiUrl: string;
} | null {
  const apiKey = process.env.FINNHUB_API_KEY?.trim() ?? "";

  if (!apiKey) {
    return null;
  }

  return {
    apiKey,
    apiUrl: (process.env.FINNHUB_API_URL?.trim() || "https://finnhub.io").replace(/\/$/, ""),
  };
}

function resolveQuotePrice(currentPrice: number | undefined): number | null {
  const hasCurrent = typeof currentPrice === "number" && Number.isFinite(currentPrice) && currentPrice > 0;

  if (hasCurrent) {
    return currentPrice ?? null;
  }

  return null;
}

async function fetchFinnhubLatestQuote(ticker: string): Promise<MarketQuote | null> {
  const config = getFinnhubConfig();
  if (!config) return null;

  const url = `${config.apiUrl}/api/v1/quote?symbol=${encodeURIComponent(ticker)}&token=${encodeURIComponent(config.apiKey)}`;

  try {
    const response = await fetch(url, {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as FinnhubQuoteResponse;
    const price = resolveQuotePrice(payload.c);
    if (!price) {
      return null;
    }

    const quoteEpochSeconds = payload.t;
    const capturedAt = typeof quoteEpochSeconds === "number" && Number.isFinite(quoteEpochSeconds) && quoteEpochSeconds > 0
      ? new Date(quoteEpochSeconds * 1000).toISOString()
      : new Date().toISOString();

    return {
      ticker,
      price,
      source: "finnhub-quote",
      capturedAt,
    };
  } catch {
    return null;
  }
}

export async function getLatestPrice(ticker: string): Promise<MarketQuote> {
  const normalizedTicker = ticker.trim().toUpperCase();
  const finnhubQuote = await fetchFinnhubLatestQuote(normalizedTicker);
  if (finnhubQuote) {
    return finnhubQuote;
  }

  throw new Error(
    `We don't currently support market data for ${normalizedTicker}. Please try another ticker.`,
  );
}