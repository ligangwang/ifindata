"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatTickerSymbol, PredictionAuthorSummary, PredictionReturnSummary } from "@/components/prediction-ui";
import { type PredictionStatus } from "@/lib/predictions/types";

type PublicStatusFilter = "ALL" | "LIVE" | "FINAL";

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
  ticker: string;
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

type FeedResponse = {
  items: Prediction[];
  nextCursor: string | null;
};

const FILTERS: Array<{ label: string; value: PublicStatusFilter }> = [
  { label: "All", value: "ALL" },
  { label: "Live", value: "LIVE" },
  { label: "Final", value: "FINAL" },
];

export function PredictionsFeed() {
  const [status, setStatus] = useState<PublicStatusFilter>("ALL");
  const [items, setItems] = useState<Prediction[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("limit", "20");
    if (status !== "ALL") {
      params.set("status", status);
    }
    return params.toString();
  }, [status]);

  useEffect(() => {
    let cancelled = false;

    void fetch(`/api/predictions?${query}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Unable to load predictions.");
        }

        const payload = (await response.json()) as FeedResponse;
        if (!cancelled) {
          setItems(payload.items);
          setNextCursor(payload.nextCursor);
        }
      })
      .catch((nextError) => {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : "Unable to load feed.");
          setItems([]);
          setNextCursor(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [query]);

  async function loadMore() {
    if (!nextCursor) {
      return;
    }

    const params = new URLSearchParams(query);
    params.set("cursorCreatedAt", nextCursor);

    const response = await fetch(`/api/predictions?${params.toString()}`);
    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as FeedResponse;
    setItems((prev) => [...prev, ...payload.items]);
    setNextCursor(payload.nextCursor);
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-5">
      <section className="rounded-2xl border border-cyan-500/25 bg-slate-900/70 p-4 shadow-[0_8px_40px_rgba(8,47,73,0.45)]">
        <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
          <div className="inline-flex rounded-full border border-slate-700 bg-slate-800/70 p-1 text-xs">
            {FILTERS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setStatus(option.value);
                  setLoading(true);
                  setError(null);
                  setItems([]);
                  setNextCursor(null);
                }}
                className={`rounded-full px-3 py-1.5 transition ${
                  status === option.value ? "bg-cyan-500 text-slate-950" : "text-slate-200 hover:text-white"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? <p className="text-sm text-slate-300">Loading feed...</p> : null}
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}

        <div className="grid gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-white/10 bg-slate-950/55 p-4 transition"
            >
              <div className="mb-2 flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                <Link
                  href={`/ticker/${item.ticker}`}
                  className="flex w-fit items-center gap-1 font-semibold text-cyan-200 hover:text-cyan-100"
                  aria-label={`${item.direction === "UP" ? "Up" : "Down"} prediction for ${item.ticker}`}
                >
                  <span aria-hidden="true">{item.direction === "UP" ? "\u2191" : "\u2193"}</span>
                  <span>{formatTickerSymbol(item.ticker)}</span>
                </Link>
              </div>
              <PredictionReturnSummary prediction={item} href={`/predictions/${item.id}`} status={item.status} />
              <PredictionAuthorSummary author={item} />
            </div>
          ))}

          {!loading && items.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/20 p-5 text-sm text-slate-300">
              No predictions found for this filter.
            </p>
          ) : null}
        </div>

        {nextCursor ? (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => void loadMore()}
              className="w-full rounded-full border border-cyan-400/35 px-4 py-2 text-sm text-cyan-100 hover:bg-cyan-500/15 sm:w-auto"
            >
              Load more
            </button>
          </div>
        ) : null}
      </section>
    </main>
  );
}
