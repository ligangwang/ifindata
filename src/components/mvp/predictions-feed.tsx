"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DirectionBadge, formatScorePercent, PredictionMarkSummary } from "@/components/mvp/prediction-ui";
import { sanitizePredictionThesis } from "@/lib/predictions/types";

type Prediction = {
  id: string;
  userId: string;
  authorDisplayName: string | null;
  authorNickname: string | null;
  ticker: string;
  direction: "UP" | "DOWN";
  entryPrice: number;
  entryDate: string;
  thesis: string;
  status: "ACTIVE" | "SETTLED";
  createdAt: string;
  expiryAt: string;
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

export function PredictionsFeed({ title }: { title: string }) {
  const [status, setStatus] = useState<"ALL" | "ACTIVE" | "SETTLED">("ALL");
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
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <section className="rounded-2xl border border-cyan-500/25 bg-slate-900/70 p-5 shadow-[0_8px_40px_rgba(8,47,73,0.45)]">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-[var(--font-sora)] text-2xl font-semibold text-cyan-100">{title}</h1>
          <div className="inline-flex rounded-full border border-slate-700 bg-slate-800/70 p-1 text-xs">
            {(["ALL", "ACTIVE", "SETTLED"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setStatus(option);
                  setLoading(true);
                  setError(null);
                  setItems([]);
                  setNextCursor(null);
                }}
                className={`rounded-full px-3 py-1.5 transition ${
                  status === option ? "bg-cyan-500 text-slate-950" : "text-slate-200 hover:text-white"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {loading ? <p className="text-sm text-slate-300">Loading feed...</p> : null}
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}

        <div className="grid gap-3">
          {items.map((item) => {
            const thesis = sanitizePredictionThesis(item.thesis);

            return (
              <div
                key={item.id}
                className="rounded-xl border border-white/10 bg-slate-950/55 p-4 transition"
              >
                <div className="mb-2 flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <Link
                    href={`/ticker/${item.ticker}`}
                    className="flex w-fit items-center gap-1 font-semibold text-cyan-200 hover:text-cyan-100"
                  >
                    <span>{item.ticker}</span>
                    <span className="text-slate-500">/</span>
                    <DirectionBadge direction={item.direction} />
                  </Link>
                  <p className="text-xs text-slate-400 sm:text-sm">{new Date(item.createdAt).toLocaleString()}</p>
                </div>
                <Link
                  href={`/predictions/${item.id}`}
                  className="line-clamp-2 text-sm text-slate-100 hover:text-slate-50"
                >
                  {thesis || "No thesis provided."}
                </Link>
                <div className="mt-3 flex flex-col gap-1 text-xs text-slate-300 sm:flex-row sm:items-center sm:justify-between">
                  <p>
                    by{" "}
                    <Link
                      href={`/analysts/${item.userId}`}
                      className="text-cyan-300 hover:text-cyan-100"
                    >
                      {item.authorNickname ? `@${item.authorNickname}` : item.authorDisplayName ?? "Anonymous"}
                    </Link>
                  </p>
                  <p>
                    {item.status}
                    {item.result ? ` / ${formatScorePercent(item.result.score)}` : ""}
                  </p>
                </div>
                <PredictionMarkSummary prediction={item} />
                <p className="mt-1 text-xs text-slate-400">Expires {new Date(item.expiryAt).toLocaleDateString()}</p>
              </div>
            );
          })}

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
