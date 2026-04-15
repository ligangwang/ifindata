"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DirectionBadge, formatScorePercent, PredictionMarkSummary } from "@/components/mvp/prediction-ui";

type Prediction = {
  id: string;
  userId: string;
  authorDisplayName: string | null;
  authorNickname: string | null;
  direction: "UP" | "DOWN";
  entryPrice: number;
  entryDate: string;
  thesis: string;
  status: "OPEN" | "CLOSED";
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
  ticker: string;
};

export function TickerPage({ ticker }: { ticker: string }) {
  const [payload, setPayload] = useState<TickerResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void fetch(`/api/ticker/${ticker}?limit=100`)
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
        <h1 className="font-[var(--font-sora)] text-3xl font-semibold text-cyan-100">{payload.ticker}</h1>
        <p className="mt-2 text-sm text-slate-300">All public predictions for {payload.ticker}</p>
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
                <p className="flex items-center gap-1 text-sm font-semibold text-cyan-200">
                  <DirectionBadge direction={prediction.direction} />
                  <span className="text-slate-500">/</span>
                  <span>{prediction.status}</span>
                </p>
                <p className="text-xs text-slate-400">{new Date(prediction.createdAt).toLocaleString()}</p>
              </div>
              <Link href={`/predictions/${prediction.id}`} className="mt-2 block line-clamp-2 text-sm text-slate-100 hover:text-slate-50">
                {prediction.thesis || "No thesis provided."}
              </Link>
              <div className="mt-2 flex flex-col gap-1 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                <p>
                  by{" "}
                  {prediction.userId ? (
                    <Link href={`/analysts/${prediction.userId}`} className="text-cyan-300 hover:text-cyan-100">
                      {prediction.authorNickname ? `@${prediction.authorNickname}` : prediction.authorDisplayName ?? "Anonymous"}
                    </Link>
                  ) : (
                    prediction.authorNickname ? `@${prediction.authorNickname}` : prediction.authorDisplayName ?? "Anonymous"
                  )}
                </p>
                {prediction.result ? <p className="text-emerald-200">Result {formatScorePercent(prediction.result.score)}</p> : null}
              </div>
              <PredictionMarkSummary prediction={prediction} />
            </article>
          ))}

          {payload.items.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/20 p-5 text-sm text-slate-300">
              No predictions for {payload.ticker} yet.
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
