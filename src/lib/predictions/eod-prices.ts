import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import {
  computeDisplayPercent,
  computeReturnValue,
  computeScoreFromReturn,
  isPredictionDirection,
  normalizeTicker,
  type PredictionResult,
  type PredictionStatus,
} from "@/lib/predictions/types";

const EOD_PRICE_SOURCE = "twelve-data-time-series";
const DEFAULT_MARKET = "US";
const DEFAULT_LIMIT = 500;
const MAX_LIMIT = 1000;
const POSITION_SCAN_PAGE_SIZE = 500;
const TWELVE_DATA_CHUNK_SIZE = 8;

export type DailyEodMaintenanceInput = {
  runDate?: string;
  limit?: number;
  dryRun?: boolean;
  tickers?: string[];
  loadPrices?: boolean;
  markPredictions?: boolean;
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
  candidatePredictions: number;
  actionablePredictions: number;
  scannedCandidatePredictions: number;
  hasMoreCandidatePredictions: boolean;
  priceLoad: {
    requestedTickers: number;
    cacheHits: number;
    loaded: number;
    failed: number;
    skipped: number;
    prices: Array<Pick<EodPrice, "ticker" | "tradingDate" | "close" | "source">>;
    failures: Array<{ ticker: string; reason: string }>;
  };
  marking: {
    checked: number;
    opened: number;
    marked: number;
    closed: number;
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

type EodPredictionRecord = {
  ref: FirebaseFirestore.DocumentReference;
  id: string;
  userId: string;
  ticker: string;
  direction: unknown;
  entryPrice: number | null;
  entryTargetDate: string | null;
  closeTargetDate: string | null;
  markPriceDate: string | null;
  status: PredictionStatus;
};

type EodPredictionScanResult = {
  candidatePredictions: EodPredictionRecord[];
  predictionsNeedingWork: EodPredictionRecord[];
  scannedCandidatePredictions: number;
  hasMoreCandidatePredictions: boolean;
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

function eodRunDocId(runDate: string, market = DEFAULT_MARKET): string {
  return [market, runDate].join("_");
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
    url.searchParams.set("start_date", `${requestedDate} 00:00:00`);
    url.searchParams.set("end_date", `${requestedDate} 23:59:59`);
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

function isEodCandidateStatus(value: unknown): value is "OPENING" | "OPEN" | "CLOSING" {
  return value === "OPENING" || value === "OPEN" || value === "CLOSING";
}

function toEodPredictionRecord(snapshot: FirebaseFirestore.QueryDocumentSnapshot): EodPredictionRecord | null {
  const data = snapshot.data() as Record<string, unknown>;
  const ticker = typeof data.ticker === "string" ? normalizeTicker(data.ticker) : "";
  const userId = typeof data.userId === "string" ? data.userId : "";
  const markPriceDate = typeof data.markPriceDate === "string" ? data.markPriceDate : null;
  const entryTargetDate = typeof data.entryTargetDate === "string" ? data.entryTargetDate : null;
  const closeTargetDate = typeof data.closeTargetDate === "string" ? data.closeTargetDate : null;
  const entryPrice = data.entryPrice === null || data.entryPrice === undefined ? null : Number(data.entryPrice);

  if (!ticker || !userId || !isEodCandidateStatus(data.status)) {
    return null;
  }

  if (entryPrice !== null && (!Number.isFinite(entryPrice) || entryPrice <= 0)) {
    return null;
  }

  return {
    ref: snapshot.ref,
    id: snapshot.id,
    userId,
    ticker,
    direction: data.direction,
    entryPrice,
    entryTargetDate,
    closeTargetDate,
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

function buildMarkUpdate(price: EodPrice, mark: { returnValue: number; score: number; displayPercent: number }, nowIso: string) {
  return {
    updatedAt: nowIso,
    markPrice: price.close,
    markPriceSource: price.source,
    markPriceDate: price.tradingDate,
    markPriceCapturedAt: price.loadedAt,
    markReturnValue: mark.returnValue,
    markScore: mark.score,
    markDisplayPercent: mark.displayPercent,
  };
}

function buildResult(price: EodPrice, mark: { returnValue: number; score: number; displayPercent: number }): PredictionResult {
  return {
    exitPrice: price.close,
    exitPriceSource: price.source,
    returnValue: mark.returnValue,
    score: mark.score,
    displayPercent: mark.displayPercent,
  };
}

function isActionablePrediction(prediction: EodPredictionRecord, runDate: string, manualTickers: string[]): boolean {
  if (manualTickers.length > 0 && !manualTickers.includes(prediction.ticker)) {
    return false;
  }

  if (prediction.status === "OPENING") {
    return typeof prediction.entryTargetDate === "string" && prediction.entryTargetDate <= runDate;
  }

  if (prediction.status === "CLOSING") {
    return typeof prediction.closeTargetDate === "string" && prediction.closeTargetDate <= runDate;
  }

  return prediction.markPriceDate !== runDate;
}

async function scanEodPredictions(
  db: FirebaseFirestore.Firestore,
  runDate: string,
  limit: number,
  manualTickers: string[],
): Promise<EodPredictionScanResult> {
  const candidatePredictions: EodPredictionRecord[] = [];
  const predictionsNeedingWork: EodPredictionRecord[] = [];
  let lastDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null;
  let scannedCandidatePredictions = 0;
  let hasMoreCandidatePredictions = false;

  while (predictionsNeedingWork.length < limit) {
    let query = db
      .collection("predictions")
      .where("status", "in", ["OPENING", "OPEN", "CLOSING"])
      .orderBy("__name__")
      .limit(POSITION_SCAN_PAGE_SIZE);

    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const snapshot = await query.get();
    if (snapshot.empty) {
      hasMoreCandidatePredictions = false;
      break;
    }

    scannedCandidatePredictions += snapshot.size;

    for (const doc of snapshot.docs) {
      const prediction = toEodPredictionRecord(doc);
      if (!prediction) {
        continue;
      }

      candidatePredictions.push(prediction);

      if (isActionablePrediction(prediction, runDate, manualTickers)) {
        predictionsNeedingWork.push(prediction);
        if (predictionsNeedingWork.length >= limit) {
          break;
        }
      }
    }

    lastDoc = snapshot.docs[snapshot.docs.length - 1] ?? null;
    hasMoreCandidatePredictions = snapshot.size === POSITION_SCAN_PAGE_SIZE;

    if (!hasMoreCandidatePredictions) {
      break;
    }
  }

  return {
    candidatePredictions,
    predictionsNeedingWork,
    scannedCandidatePredictions,
    hasMoreCandidatePredictions,
  };
}

export async function runDailyEodMaintenance(
  input: DailyEodMaintenanceInput = {},
): Promise<DailyEodMaintenanceResult> {
  const db = getAdminFirestore();
  const dryRun = input.dryRun === true;
  const loadPrices = input.loadPrices !== false;
  const markPredictions = input.markPredictions !== false;
  const runDate = resolveRunDate(input.runDate);
  const limit = clampLimit(input.limit);
  const nowIso = new Date().toISOString();
  const manualTickers = input.tickers?.length ? uniqueTickers(input.tickers) : [];
  const runRef = db.collection("eod_runs").doc(eodRunDocId(runDate));

  console.info("[daily-eod-maintenance] Starting run", {
    runDate,
    dryRun,
    loadPrices,
    markPredictions,
    limit,
    manualTickers,
  });

  if (!dryRun) {
    await runRef.set({
      market: DEFAULT_MARKET,
      runDate,
      status: "STARTED",
      startedAt: nowIso,
      completedAt: null,
      failedAt: null,
      error: null,
    }, { merge: true });
  }

  try {
    const {
      candidatePredictions,
      predictionsNeedingWork,
      scannedCandidatePredictions,
      hasMoreCandidatePredictions,
    } = await scanEodPredictions(db, runDate, limit, manualTickers);
    const requestedTickers = manualTickers.length > 0
      ? manualTickers
      : uniqueTickers(predictionsNeedingWork.map((item) => item.ticker));

    console.info("[daily-eod-maintenance] Prediction scan completed", {
      runDate,
      candidatePredictions: candidatePredictions.length,
      actionablePredictions: predictionsNeedingWork.length,
      scannedCandidatePredictions,
      hasMoreCandidatePredictions,
      requestedTickers,
    });

    const priceLoad: DailyEodMaintenanceResult["priceLoad"] = {
      requestedTickers: requestedTickers.length,
      cacheHits: 0,
      loaded: 0,
      failed: 0,
      skipped: loadPrices ? candidatePredictions.length - predictionsNeedingWork.length : requestedTickers.length,
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
    const marking: DailyEodMaintenanceResult["marking"] = {
      checked: markPredictions ? predictionsNeedingWork.length : 0,
      opened: 0,
      marked: 0,
      closed: 0,
      missingPrice: 0,
      skipped: 0,
    };

    if (markPredictions) {
      for (const prediction of predictionsNeedingWork) {
        const price = priceByTicker.get(prediction.ticker);
        if (!price) {
          marking.missingPrice += 1;
          console.warn("[daily-eod-maintenance] Missing EOD price for prediction", {
            runDate,
            predictionId: prediction.id,
            ticker: prediction.ticker,
            status: prediction.status,
          });
          continue;
        }

        if (dryRun) {
          if (prediction.status === "OPENING") {
            marking.opened += 1;
          } else if (prediction.status === "CLOSING") {
            marking.marked += 1;
            marking.closed += 1;
          } else {
            marking.marked += 1;
          }
          continue;
        }

        await db.runTransaction(async (tx) => {
          const predictionSnapshot = await tx.get(prediction.ref);

          if (!predictionSnapshot.exists) {
            marking.skipped += 1;
            console.warn("[daily-eod-maintenance] Skipped prediction because prediction doc is missing", {
              runDate,
              predictionId: prediction.id,
            });
            return;
          }

          const latest = predictionSnapshot.data() as Record<string, unknown>;
          const latestStatus = latest.status;
          if (latestStatus !== prediction.status || !isEodCandidateStatus(latestStatus)) {
            marking.skipped += 1;
            console.warn("[daily-eod-maintenance] Skipped prediction because status changed", {
              runDate,
              predictionId: prediction.id,
              status: latestStatus,
            });
            return;
          }

          if (latestStatus === "OPENING") {
            tx.update(prediction.ref, {
              updatedAt: nowIso,
              status: "OPEN",
              entryPrice: price.close,
              entryPriceSource: price.source,
              entryDate: price.tradingDate,
              entryTime: "16:00:00",
              entryCapturedAt: price.loadedAt,
            });
            tx.update(db.collection("users").doc(prediction.userId), {
              updatedAt: nowIso,
              "stats.openingPredictions": FieldValue.increment(-1),
              "stats.openPredictions": FieldValue.increment(1),
            });
            marking.opened += 1;
            return;
          }

          const entryPrice = Number(latest.entryPrice);
          const mark = computeMark(latest.direction, entryPrice, price.close);
          if (!mark) {
            marking.skipped += 1;
            console.warn("[daily-eod-maintenance] Skipped prediction with invalid mark inputs", {
              runDate,
              predictionId: prediction.id,
              ticker: prediction.ticker,
              direction: latest.direction,
              entryPrice,
            });
            return;
          }

          const markUpdate = buildMarkUpdate(price, mark, nowIso);

          if (latestStatus === "CLOSING") {
            const result = buildResult(price, mark);
            tx.update(prediction.ref, {
              ...markUpdate,
              status: "CLOSED",
              closedAt: nowIso,
              result,
            });
            tx.update(db.collection("users").doc(prediction.userId), {
              updatedAt: nowIso,
              "stats.closingPredictions": FieldValue.increment(-1),
              "stats.closedPredictions": FieldValue.increment(1),
              "stats.totalScore": FieldValue.increment(result.score),
            });
            marking.marked += 1;
            marking.closed += 1;
            return;
          }

          tx.update(prediction.ref, markUpdate);
          marking.marked += 1;
        });
      }
    }

    const result: DailyEodMaintenanceResult = {
      dryRun,
      runDate,
      latestTradingDate,
      candidatePredictions: candidatePredictions.length,
      actionablePredictions: predictionsNeedingWork.length,
      scannedCandidatePredictions,
      hasMoreCandidatePredictions,
      priceLoad,
      marking,
    };
    if (!dryRun) {
      await runRef.set({
        market: DEFAULT_MARKET,
        runDate,
        status: "COMPLETED",
        completedAt: new Date().toISOString(),
        error: null,
      }, { merge: true });
    }
    console.info("[daily-eod-maintenance] Completed run", result);
    return result;
  } catch (error) {
    if (!dryRun) {
      await runRef.set({
        market: DEFAULT_MARKET,
        runDate,
        status: "FAILED",
        failedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
      }, { merge: true });
    }
    throw error;
  }
}
