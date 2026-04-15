import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import {
  computeDisplayPercent,
  computeReturnValue,
  computeScoreFromReturn,
  isPredictionDirection,
  normalizeTicker,
  type PredictionResult,
} from "@/lib/predictions/types";

const EOD_PRICE_SOURCE = "twelve-data-time-series";
const DEFAULT_MARKET = "US";
const DEFAULT_LIMIT = 500;
const MAX_LIMIT = 1000;
const ACTIVE_SCAN_PAGE_SIZE = 500;
const TWELVE_DATA_CHUNK_SIZE = 8;

export type DailyEodMaintenanceInput = {
  runDate?: string;
  limit?: number;
  dryRun?: boolean;
  tickers?: string[];
  loadPrices?: boolean;
  settle?: boolean;
};

export type EodPrice = {
  market: string;
  ticker: string;
  requestedDate: string;
  tradingDate: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
  source: string;
  providerSymbol: string;
  exchange: string | null;
  exchangeTimezone: string | null;
  micCode: string | null;
  loadedAt: string;
  isFinal: true;
};

export type DailyEodMaintenanceResult = {
  dryRun: boolean;
  runDate: string;
  latestTradingDate: string | null;
  activePredictions: number;
  actionablePredictions: number;
  scannedActivePredictions: number;
  hasMoreActivePredictions: boolean;
  priceLoad: {
    requestedTickers: number;
    cacheHits: number;
    loaded: number;
    failed: number;
    skipped: number;
    prices: Array<Pick<EodPrice, "ticker" | "tradingDate" | "close" | "source">>;
    failures: Array<{ ticker: string; reason: string }>;
  };
  settlement: {
    checked: number;
    marked: number;
    settled: number;
    missingPrice: number;
    skipped: number;
  };
};

type TwelveDataTimeSeriesValue = {
  datetime?: string;
  open?: string;
  high?: string;
  low?: string;
  close?: string;
  volume?: string;
};

type TwelveDataSymbolResponse = {
  meta?: {
    symbol?: string;
    exchange?: string;
    exchange_timezone?: string;
    mic_code?: string;
  };
  values?: TwelveDataTimeSeriesValue[];
  status?: string;
  message?: string;
};

type TwelveDataBatchResponse = Record<string, TwelveDataSymbolResponse>;

type ActivePredictionRecord = {
  ref: FirebaseFirestore.DocumentReference;
  id: string;
  userId: string;
  ticker: string;
  direction: unknown;
  entryPrice: number;
  expiryDate: string;
  markPriceDate: string | null;
  status: unknown;
};

type ActivePredictionScanResult = {
  activePredictions: ActivePredictionRecord[];
  predictionsNeedingWork: ActivePredictionRecord[];
  scannedActivePredictions: number;
  hasMoreActivePredictions: boolean;
};

function getTwelveDataConfig(): { apiKey: string; apiUrl: string } {
  const apiKey = process.env.TWELVE_DATA_API_KEY?.trim() ?? "";
  if (!apiKey) {
    throw new Error("TWELVE_DATA_API_KEY is not configured.");
  }

  return {
    apiKey,
    apiUrl: (process.env.TWELVE_DATA_API_URL?.trim() || "https://api.twelvedata.com").replace(/\/$/, ""),
  };
}

function clampLimit(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_LIMIT;
  }
  return Math.max(1, Math.min(Math.floor(parsed), MAX_LIMIT));
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime());
}

function getCurrentEasternDate(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    return new Date().toISOString().slice(0, 10);
  }

  return `${year}-${month}-${day}`;
}

function resolveRunDate(value: string | undefined): string {
  const runDate = value?.trim() || getCurrentEasternDate();
  if (!isIsoDate(runDate)) {
    throw new Error("runDate must be a YYYY-MM-DD date.");
  }
  return runDate;
}

function toFiniteNumber(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function uniqueTickers(tickers: string[]): string[] {
  return Array.from(new Set(tickers.map(normalizeTicker).filter(Boolean))).sort();
}

function eodPriceDocId(ticker: string, tradingDate: string, market = DEFAULT_MARKET): string {
  return [market, ticker, tradingDate].join("_");
}

function toCachedEodPrice(data: FirebaseFirestore.DocumentData | undefined): EodPrice | null {
  if (!data) {
    return null;
  }

  const ticker = typeof data.ticker === "string" ? normalizeTicker(data.ticker) : "";
  const requestedDate = typeof data.requestedDate === "string" ? data.requestedDate : "";
  const tradingDate = typeof data.tradingDate === "string" ? data.tradingDate : "";
  const open = toFiniteNumber(data.open);
  const high = toFiniteNumber(data.high);
  const low = toFiniteNumber(data.low);
  const close = toFiniteNumber(data.close);

  if (!ticker || !isIsoDate(requestedDate) || !isIsoDate(tradingDate) || open === null || high === null || low === null || close === null) {
    return null;
  }

  return {
    market: typeof data.market === "string" && data.market.trim() ? data.market : DEFAULT_MARKET,
    ticker,
    requestedDate,
    tradingDate,
    open,
    high,
    low,
    close,
    volume: toFiniteNumber(data.volume),
    source: typeof data.source === "string" ? data.source : EOD_PRICE_SOURCE,
    providerSymbol: typeof data.providerSymbol === "string" ? data.providerSymbol : ticker,
    exchange: typeof data.exchange === "string" ? data.exchange : null,
    exchangeTimezone: typeof data.exchangeTimezone === "string" ? data.exchangeTimezone : null,
    micCode: typeof data.micCode === "string" ? data.micCode : null,
    loadedAt: typeof data.loadedAt === "string" ? data.loadedAt : new Date().toISOString(),
    isFinal: true,
  };
}

async function readCachedEodPrices(tickers: string[], tradingDate: string): Promise<Map<string, EodPrice>> {
  const db = getAdminFirestore();
  const cached = new Map<string, EodPrice>();

  await Promise.all(
    tickers.map(async (ticker) => {
      const snapshot = await db
        .collection("eod_prices")
        .doc(eodPriceDocId(ticker, tradingDate))
        .get();
      const price = snapshot.exists ? toCachedEodPrice(snapshot.data()) : null;
      if (price) {
        cached.set(ticker, price);
      }
    }),
  );

  return cached;
}

function parseTwelveDataPrice(
  ticker: string,
  requestedDate: string,
  loadedAt: string,
  payload: TwelveDataSymbolResponse | undefined,
): EodPrice | { ticker: string; reason: string } {
  if (!payload) {
    return { ticker, reason: "missing_symbol_response" };
  }

  if (payload.status && payload.status !== "ok") {
    return { ticker, reason: payload.message || payload.status };
  }

  const latest = payload.values?.[0];
  if (!latest?.datetime || !isIsoDate(latest.datetime)) {
    return { ticker, reason: "missing_trading_date" };
  }

  if (latest.datetime !== requestedDate) {
    return { ticker, reason: `trading_date_mismatch_${latest.datetime}` };
  }

  const open = toFiniteNumber(latest.open);
  const high = toFiniteNumber(latest.high);
  const low = toFiniteNumber(latest.low);
  const close = toFiniteNumber(latest.close);

  if (open === null || high === null || low === null || close === null || close <= 0) {
    return { ticker, reason: "invalid_ohlc" };
  }

  return {
    market: DEFAULT_MARKET,
    ticker,
    requestedDate,
    tradingDate: latest.datetime,
    open,
    high,
    low,
    close,
    volume: toFiniteNumber(latest.volume),
    source: EOD_PRICE_SOURCE,
    providerSymbol: payload.meta?.symbol ?? ticker,
    exchange: payload.meta?.exchange ?? null,
    exchangeTimezone: payload.meta?.exchange_timezone ?? null,
    micCode: payload.meta?.mic_code ?? null,
    loadedAt,
    isFinal: true,
  };
}

async function fetchTwelveDataEodPrices(
  tickers: string[],
  requestedDate: string,
  loadedAt: string,
): Promise<{ prices: EodPrice[]; failures: Array<{ ticker: string; reason: string }> }> {
  if (tickers.length === 0) {
    return { prices: [], failures: [] };
  }

  const config = getTwelveDataConfig();
  const prices: EodPrice[] = [];
  const failures: Array<{ ticker: string; reason: string }> = [];

  for (const tickerChunk of chunk(tickers, TWELVE_DATA_CHUNK_SIZE)) {
    const url = new URL(`${config.apiUrl}/time_series`);
    url.searchParams.set("symbol", tickerChunk.join(","));
    url.searchParams.set("interval", "1day");
    url.searchParams.set("start_date", requestedDate);
    url.searchParams.set("end_date", requestedDate);
    url.searchParams.set("apikey", config.apiKey);

    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      tickerChunk.forEach((ticker) => failures.push({ ticker, reason: `provider_http_${response.status}` }));
      continue;
    }

    const payload = (await response.json()) as TwelveDataBatchResponse | TwelveDataSymbolResponse;
    const byTicker = tickerChunk.length === 1 && "values" in payload
      ? { [tickerChunk[0]]: payload as TwelveDataSymbolResponse }
      : payload as TwelveDataBatchResponse;

    tickerChunk.forEach((ticker) => {
      const parsed = parseTwelveDataPrice(ticker, requestedDate, loadedAt, byTicker[ticker]);
      if ("reason" in parsed) {
        failures.push(parsed);
      } else {
        prices.push(parsed);
      }
    });
  }

  return { prices, failures };
}

function toActivePredictionRecord(snapshot: FirebaseFirestore.QueryDocumentSnapshot): ActivePredictionRecord | null {
  const data = snapshot.data() as Record<string, unknown>;
  const ticker = typeof data.ticker === "string" ? normalizeTicker(data.ticker) : "";
  const userId = typeof data.userId === "string" ? data.userId : "";
  const expiryDate = typeof data.expiryDate === "string" ? data.expiryDate : "";
  const markPriceDate = typeof data.markPriceDate === "string" ? data.markPriceDate : null;
  const entryPrice = Number(data.entryPrice);

  if (!ticker || !userId || !isIsoDate(expiryDate) || !Number.isFinite(entryPrice) || entryPrice <= 0) {
    return null;
  }

  return {
    ref: snapshot.ref,
    id: snapshot.id,
    userId,
    ticker,
    direction: data.direction,
    entryPrice,
    expiryDate,
    markPriceDate,
    status: data.status,
  };
}

function computeMark(
  direction: unknown,
  entryPrice: number,
  markPrice: number,
): { returnValue: number; score: number; displayPercent: number } | null {
  if (!isPredictionDirection(direction)) {
    return null;
  }

  const returnValue = computeReturnValue(direction, entryPrice, markPrice);
  const score = computeScoreFromReturn(returnValue);
  return {
    returnValue,
    score,
    displayPercent: computeDisplayPercent(score),
  };
}

async function scanActivePredictions(
  db: FirebaseFirestore.Firestore,
  runDate: string,
  limit: number,
  manualTickers: string[],
): Promise<ActivePredictionScanResult> {
  const activePredictions: ActivePredictionRecord[] = [];
  const predictionsNeedingWork: ActivePredictionRecord[] = [];
  let lastDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null;
  let scannedActivePredictions = 0;
  let hasMoreActivePredictions = false;

  while (predictionsNeedingWork.length < limit) {
    let query = db
      .collection("predictions")
      .where("status", "==", "ACTIVE")
      .orderBy("__name__")
      .limit(ACTIVE_SCAN_PAGE_SIZE);

    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const snapshot = await query.get();
    if (snapshot.empty) {
      hasMoreActivePredictions = false;
      break;
    }

    scannedActivePredictions += snapshot.size;

    for (const doc of snapshot.docs) {
      const prediction = toActivePredictionRecord(doc);
      if (!prediction) {
        continue;
      }

      activePredictions.push(prediction);

      const isActionable = manualTickers.length > 0
        ? manualTickers.includes(prediction.ticker)
        : prediction.markPriceDate !== runDate;

      if (isActionable) {
        predictionsNeedingWork.push(prediction);
        if (predictionsNeedingWork.length >= limit) {
          break;
        }
      }
    }

    lastDoc = snapshot.docs[snapshot.docs.length - 1] ?? null;
    hasMoreActivePredictions = snapshot.size === ACTIVE_SCAN_PAGE_SIZE;

    if (!hasMoreActivePredictions) {
      break;
    }
  }

  return {
    activePredictions,
    predictionsNeedingWork,
    scannedActivePredictions,
    hasMoreActivePredictions,
  };
}

export async function runDailyEodMaintenance(
  input: DailyEodMaintenanceInput = {},
): Promise<DailyEodMaintenanceResult> {
  const db = getAdminFirestore();
  const dryRun = input.dryRun === true;
  const loadPrices = input.loadPrices !== false;
  const settle = input.settle !== false;
  const runDate = resolveRunDate(input.runDate);
  const limit = clampLimit(input.limit);
  const nowIso = new Date().toISOString();
  const manualTickers = input.tickers?.length ? uniqueTickers(input.tickers) : [];

  console.info("[daily-eod-maintenance] Starting run", {
    runDate,
    dryRun,
    loadPrices,
    settle,
    limit,
    manualTickers,
  });

  const {
    activePredictions,
    predictionsNeedingWork,
    scannedActivePredictions,
    hasMoreActivePredictions,
  } = await scanActivePredictions(db, runDate, limit, manualTickers);
  const requestedTickers = manualTickers.length > 0
    ? manualTickers
    : uniqueTickers(predictionsNeedingWork.map((item) => item.ticker));

  console.info("[daily-eod-maintenance] Active prediction scan completed", {
    runDate,
    activePredictions: activePredictions.length,
    actionablePredictions: predictionsNeedingWork.length,
    scannedActivePredictions,
    hasMoreActivePredictions,
    requestedTickers,
  });

  const priceLoad: DailyEodMaintenanceResult["priceLoad"] = {
    requestedTickers: requestedTickers.length,
    cacheHits: 0,
    loaded: 0,
    failed: 0,
    skipped: loadPrices ? activePredictions.length - predictionsNeedingWork.length : requestedTickers.length,
    prices: [],
    failures: [],
  };

  const priceByTicker = new Map<string, EodPrice>();

  if (loadPrices && requestedTickers.length > 0) {
    console.info("[daily-eod-maintenance] Loading EOD prices", {
      runDate,
      requestedTickers,
    });

    const cachedPrices = await readCachedEodPrices(requestedTickers, runDate);
    cachedPrices.forEach((price, ticker) => {
      priceByTicker.set(ticker, price);
    });
    priceLoad.cacheHits = cachedPrices.size;

    const tickersToFetch = requestedTickers.filter((ticker) => !cachedPrices.has(ticker));
    const fetched = await fetchTwelveDataEodPrices(tickersToFetch, runDate, nowIso);
    priceLoad.loaded = fetched.prices.length;
    priceLoad.failed = fetched.failures.length;
    priceLoad.prices = [...cachedPrices.values(), ...fetched.prices].map((price) => ({
      ticker: price.ticker,
      tradingDate: price.tradingDate,
      close: price.close,
      source: price.source,
    }));
    priceLoad.failures = fetched.failures;

    console.info("[daily-eod-maintenance] EOD price load completed", {
      runDate,
      requestedTickers: requestedTickers.length,
      cacheHits: priceLoad.cacheHits,
      tickersFetched: tickersToFetch.length,
      loaded: priceLoad.loaded,
      failed: priceLoad.failed,
      prices: priceLoad.prices,
      failures: priceLoad.failures,
    });

    for (const price of fetched.prices) {
      priceByTicker.set(price.ticker, price);
      if (!dryRun) {
        await db
          .collection("eod_prices")
          .doc(eodPriceDocId(price.ticker, price.tradingDate, price.market))
          .set(price, { merge: true });
      }
    }
  } else {
    console.info("[daily-eod-maintenance] EOD price load skipped", {
      runDate,
      loadPrices,
      requestedTickers: requestedTickers.length,
    });
  }

  const latestTradingDate = Array.from(priceByTicker.values())
    .map((price) => price.tradingDate)
    .sort()
    .at(-1) ?? null;
  const settlement: DailyEodMaintenanceResult["settlement"] = {
    checked: settle ? predictionsNeedingWork.length : 0,
    marked: 0,
    settled: 0,
    missingPrice: 0,
    skipped: 0,
  };

  if (!settle) {
    const result = {
      dryRun,
      runDate,
      latestTradingDate,
      activePredictions: activePredictions.length,
      actionablePredictions: predictionsNeedingWork.length,
      scannedActivePredictions,
      hasMoreActivePredictions,
      priceLoad,
      settlement,
    };
    console.info("[daily-eod-maintenance] Completed run", result);
    return result;
  }

  for (const prediction of predictionsNeedingWork) {
    const price = priceByTicker.get(prediction.ticker);
    if (!price) {
      settlement.missingPrice += 1;
      console.warn("[daily-eod-maintenance] Missing EOD price for prediction", {
        runDate,
        predictionId: prediction.id,
        ticker: prediction.ticker,
      });
      continue;
    }

    const mark = computeMark(prediction.direction, prediction.entryPrice, price.close);
    if (!mark) {
      settlement.skipped += 1;
      console.warn("[daily-eod-maintenance] Skipped prediction with invalid mark inputs", {
        runDate,
        predictionId: prediction.id,
        ticker: prediction.ticker,
        direction: prediction.direction,
      });
      continue;
    }

    const shouldSettle = prediction.expiryDate <= price.tradingDate;
    const result: PredictionResult = {
      exitPrice: price.close,
      exitPriceSource: price.source,
      returnValue: mark.returnValue,
      score: mark.score,
      displayPercent: mark.displayPercent,
    };

    if (dryRun) {
      settlement.marked += 1;
      if (shouldSettle) {
        settlement.settled += 1;
      }
      continue;
    }

    const userRef = db.collection("users").doc(prediction.userId);

    await db.runTransaction(async (tx) => {
      const [predictionSnapshot, userSnapshot] = await Promise.all([
        tx.get(prediction.ref),
        tx.get(userRef),
      ]);

      if (!predictionSnapshot.exists || !userSnapshot.exists) {
        settlement.skipped += 1;
        console.warn("[daily-eod-maintenance] Skipped prediction because prediction or user doc is missing", {
          runDate,
          predictionId: prediction.id,
          userExists: userSnapshot.exists,
          predictionExists: predictionSnapshot.exists,
        });
        return;
      }

      const latest = predictionSnapshot.data() as Record<string, unknown>;
      if (latest.status !== "ACTIVE") {
        settlement.skipped += 1;
        console.warn("[daily-eod-maintenance] Skipped prediction because status changed", {
          runDate,
          predictionId: prediction.id,
          status: latest.status,
        });
        return;
      }

      const markUpdate = {
        updatedAt: nowIso,
        markPrice: price.close,
        markPriceSource: price.source,
        markPriceDate: price.tradingDate,
        markPriceCapturedAt: price.loadedAt,
        markReturnValue: mark.returnValue,
        markScore: mark.score,
        markDisplayPercent: mark.displayPercent,
      };

      if (!shouldSettle) {
        tx.update(prediction.ref, markUpdate);
        settlement.marked += 1;
        return;
      }

      tx.update(prediction.ref, {
        ...markUpdate,
        status: "SETTLED",
        settledAt: nowIso,
        result,
      });

      tx.update(userRef, {
        updatedAt: nowIso,
        "stats.activePredictions": FieldValue.increment(-1),
        "stats.settledPredictions": FieldValue.increment(1),
        "stats.totalScore": FieldValue.increment(mark.score),
      });

      settlement.marked += 1;
      settlement.settled += 1;
    });
  }

  const result = {
    dryRun,
    runDate,
    latestTradingDate,
    activePredictions: activePredictions.length,
    actionablePredictions: predictionsNeedingWork.length,
    scannedActivePredictions,
    hasMoreActivePredictions,
    priceLoad,
    settlement,
  };
  console.info("[daily-eod-maintenance] Completed run", result);
  return result;
}
