"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatTickerSymbol, PredictionAuthorSummary, PredictionReturnSummary } from "@/components/prediction-ui";
import { type PredictionStatus } from "@/lib/predictions/types";

type Prediction = {
  id: string;
  userId: string;
  authorDisplayName: string | null;
  authorNickname: string | null;
  authorPhotoURL: string | null;
  authorStats?: {
    totalScore?: number | null;
    totalPredictions?: number | null;
  } | null;
  direction: "UP" | "DOWN";
  entryPrice: number | null;
  entryDate: string | null;
  thesisTitle: string;
  thesis: string;
  status: PredictionStatus;
  createdAt: string;
  markPrice?: number | null;
  markPriceDate?: string | null;
  markDisplayPercent?: number | null;
  commentCount: number;
  result: {
    score: number;
  } | null;
};

type TickerResponse = {
  items: Prediction[];
  nextCursor: string | null;
  ticker: string;
};

export function TickerPage({ ticker }: { ticker: string }) {
  const [payload, setPayload] = useState<TickerResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const displayTicker = formatTickerSymbol(payload?.ticker ?? ticker);

  useEffect(() => {
    let cancelled = false;

    setPayload(null);
    setError(null);
    setLoadingMore(false);

    void fetch(`/api/ticker/${ticker}?limit=25`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Unable to load ticker predictions.");
        }

        const nextPayload = (await response.json()) as TickerResponse;
        if (!cancelled) {
          setPayload(nextPayload);
        }
      })
      .catch((nextError) => {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : "Unable to load ticker.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [ticker]);

  async function loadMorePredictions() {
    if (!payload?.nextCursor || loadingMore) {
      return;
    }

    setLoadingMore(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: "25",
        cursorCreatedAt: payload.nextCursor,
      });
      const response = await fetch(`/api/ticker/${ticker}?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Unable to load more predictions.");
      }

      const nextPayload = (await response.json()) as TickerResponse;
      setPayload((current) => current
        ? {
            ...nextPayload,
            items: [...current.items, ...nextPayload.items],
          }
        : nextPayload);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to load more predictions.");
    } finally {
      setLoadingMore(false);
    }
  }

  if (!payload) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-8 text-sm text-slate-300">
        {error ?? "Loading ticker..."}
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <section className="rounded-2xl border border-cyan-500/25 bg-slate-900/70 p-5">
        <h1 className="font-[var(--font-sora)] text-3xl font-semibold text-cyan-100">{displayTicker}</h1>
        <p className="mt-2 text-sm text-slate-300">All public predictions for {displayTicker}</p>
      </section>

      <section className="mt-4 rounded-2xl border border-white/15 bg-slate-950/55 p-5">
        <h2 className="mb-3 font-[var(--font-sora)] text-lg font-semibold text-cyan-100">Predictions</h2>
        <div className="grid gap-2">
          {payload.items.map((prediction) => (
            <article
              key={prediction.id}
              className="rounded-xl border border-white/10 p-3 hover:border-cyan-300/60"
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <Link
                  href={`/ticker/${payload.ticker}`}
                  className="flex w-fit items-center gap-1 text-sm font-semibold text-cyan-200 hover:text-cyan-100"
                  aria-label={`${prediction.direction === "UP" ? "Up" : "Down"} prediction for ${payload.ticker}`}
                >
                  <span aria-hidden="true">{prediction.direction === "UP" ? "\u2191" : "\u2193"}</span>
                  <span>{displayTicker}</span>
                </Link>
              </div>
              <PredictionReturnSummary prediction={prediction} href={`/predictions/${prediction.id}`} status={prediction.status} />
              <PredictionAuthorSummary author={prediction} />
            </article>
          ))}

          {payload.items.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/20 p-5 text-sm text-slate-300">
              No predictions for {displayTicker} yet.
            </p>
          ) : null}
        </div>

        {payload.nextCursor ? (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={loadMorePredictions}
              disabled={loadingMore}
              className="rounded-lg border border-cyan-400/40 px-4 py-2 text-sm font-semibold text-cyan-100 hover:border-cyan-300 hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingMore ? "Loading..." : "Load more"}
            </button>
          </div>
        ) : null}

        {error && payload.items.length > 0 ? (
          <p className="mt-3 text-center text-sm text-rose-200">{error}</p>
        ) : null}
      </section>
    </main>
  );
}
