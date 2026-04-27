"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatTickerSymbol, PredictionReturnSummary } from "@/components/prediction-ui";
import { type PredictionStatus } from "@/lib/predictions/types";
import { watchlistCanonicalPath, watchlistShareVersion } from "@/lib/watchlists/public-share";

type WatchlistPrediction = {
  id: string;
  ticker: string;
  direction: "UP" | "DOWN";
  thesisTitle?: string;
  thesis: string;
  status: PredictionStatus;
  createdAt: string;
  entryPrice: number | null;
  entryDate: string | null;
  markPrice?: number | null;
  markPriceDate?: string | null;
  markReturnValue?: number | null;
  commentCount: number;
  result: {
    returnValue: number;
    score: number;
  } | null;
};

type WatchlistDetail = {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  metrics: {
    liveReturn: number | null;
    settledReturn: number | null;
    livePredictionCount: number;
    settledPredictionCount: number;
  };
  livePredictions: WatchlistPrediction[];
  settledPredictions: WatchlistPrediction[];
};

type WatchlistRequestState = {
  watchlistId: string;
  watchlist: WatchlistDetail | null;
  loading: boolean;
  error: string | null;
};

function returnText(value: number | null): string {
  if (typeof value !== "number") {
    return "Not marked";
  }
  const percent = value * 100;
  const sign = percent > 0 ? "+" : "";
  return `${sign}${percent.toFixed(2)}%`;
}

function watchlistShareUrl(watchlist: Pick<WatchlistDetail, "id" | "createdAt" | "updatedAt">): string {
  const url = new URL(watchlistCanonicalPath(watchlist.id), window.location.origin);
  url.searchParams.set("utm_source", "x");
  url.searchParams.set("utm_medium", "social");
  url.searchParams.set("utm_campaign", "watchlist_share");
  url.searchParams.set("share", watchlistShareVersion(watchlist.id, watchlist));
  return url.toString();
}

function watchlistShareText(watchlist: WatchlistDetail): string {
  const liveCount = watchlist.metrics.livePredictionCount;
  const settledCount = watchlist.metrics.settledPredictionCount;
  const lines = [`Tracking ${watchlist.name} on my public YouAnalyst watchlist.`];

  if (watchlist.description?.trim()) {
    lines.push("", watchlist.description.trim());
  }

  if (typeof watchlist.metrics.liveReturn === "number") {
    lines.push("", `Current live return: ${returnText(watchlist.metrics.liveReturn)} across ${liveCount} live call${liveCount === 1 ? "" : "s"}.`);
  } else if (settledCount > 0) {
    lines.push("", `${liveCount} live call${liveCount === 1 ? "" : "s"} and ${settledCount} settled call${settledCount === 1 ? "" : "s"} on the board.`);
  } else {
    lines.push("", `${liveCount} live call${liveCount === 1 ? "" : "s"} on the board.`);
  }

  return lines.join("\n");
}

function watchlistShareIntentUrl(watchlist: WatchlistDetail): string {
  const params = new URLSearchParams({
    text: watchlistShareText(watchlist),
    url: watchlistShareUrl(watchlist),
  });

  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

function PredictionRow({ prediction }: { prediction: WatchlistPrediction }) {
  const title = prediction.thesisTitle?.trim();

  return (
    <article className="rounded-xl border border-white/10 bg-slate-950/55 p-4">
      <Link
        href={`/ticker/${prediction.ticker}`}
        className="flex w-fit items-center gap-1 text-base font-semibold text-cyan-200 hover:text-cyan-100"
        aria-label={`${prediction.direction === "UP" ? "Up" : "Down"} prediction for ${prediction.ticker}`}
      >
        <span aria-hidden="true">{prediction.direction === "UP" ? "\u2191" : "\u2193"}</span>
        <span>{formatTickerSymbol(prediction.ticker)}</span>
      </Link>
      {title ? <p className="mt-2 text-sm font-medium text-slate-100">{title}</p> : null}
      <PredictionReturnSummary prediction={prediction} href={`/predictions/${prediction.id}`} status={prediction.status} />
    </article>
  );
}

export function WatchlistDetailPage({
  watchlistId,
}: {
  watchlistId: string;
}) {
  const [requestState, setRequestState] = useState<WatchlistRequestState>({
    watchlistId,
    watchlist: null,
    loading: true,
    error: null,
  });
  const [settledOpen, setSettledOpen] = useState(false);
  const isStaleRoute = requestState.watchlistId !== watchlistId;
  const loading = requestState.loading || isStaleRoute;
  const error = isStaleRoute ? null : requestState.error;
  const watchlist = isStaleRoute ? null : requestState.watchlist;

  useEffect(() => {
    let cancelled = false;

    void fetch(`/api/watchlists/${watchlistId}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Unable to load watchlist.");
        }
        return (await response.json()) as { watchlist: WatchlistDetail };
      })
      .then((payload) => {
        if (!cancelled) {
          setRequestState({
            watchlistId,
            watchlist: payload.watchlist,
            loading: false,
            error: null,
          });
        }
      })
      .catch((nextError) => {
        if (!cancelled) {
          setRequestState({
            watchlistId,
            watchlist: null,
            loading: false,
            error: nextError instanceof Error ? nextError.message : "Unable to load watchlist.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [watchlistId]);

  function openShareIntent(): void {
    if (!watchlist) {
      return;
    }
    window.open(watchlistShareIntentUrl(watchlist), "_blank", "noopener,noreferrer");
  }

  if (loading) {
    return <main className="mx-auto w-full max-w-5xl px-4 py-8 text-sm text-slate-300">Loading watchlist...</main>;
  }

  if (!watchlist || error) {
    return <main className="mx-auto w-full max-w-5xl px-4 py-8 text-sm text-rose-300">{error ?? "Watchlist not found."}</main>;
  }

  return (
    <main className="mx-auto grid w-full max-w-5xl gap-4 px-4 py-8">
      <section className="rounded-2xl border border-cyan-500/25 bg-slate-900/70 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-[var(--font-sora)] text-3xl font-semibold text-cyan-100">{watchlist.name}</h1>
            {watchlist.description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{watchlist.description}</p> : null}
          </div>
          {watchlist.isPublic ? (
            <button
              type="button"
              onClick={openShareIntent}
              className="rounded-lg bg-cyan-500 px-3 py-1.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
            >
              Share to X
            </button>
          ) : null}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Live return</p>
          <p className="mt-1 text-xl font-semibold text-cyan-100">{returnText(watchlist.metrics.liveReturn)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Settled return</p>
          <p className="mt-1 text-xl font-semibold text-cyan-100">{returnText(watchlist.metrics.settledReturn)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Live</p>
          <p className="mt-1 text-xl font-semibold text-slate-100">{watchlist.metrics.livePredictionCount.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Settled</p>
          <p className="mt-1 text-xl font-semibold text-slate-100">{watchlist.metrics.settledPredictionCount.toLocaleString()}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-white/15 bg-slate-950/55 p-5">
        <h2 className="font-[var(--font-sora)] text-xl font-semibold text-cyan-100">Live predictions</h2>
        <div className="mt-4 grid gap-3">
          {watchlist.livePredictions.map((prediction) => (
            <PredictionRow key={prediction.id} prediction={prediction} />
          ))}
          {watchlist.livePredictions.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/20 p-5 text-sm text-slate-300">
              No live predictions in this watchlist.
            </p>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-white/15 bg-slate-950/55 p-5">
        <button
          type="button"
          onClick={() => setSettledOpen((current) => !current)}
          className="flex w-full items-center justify-between gap-3 text-left"
        >
          <span className="font-[var(--font-sora)] text-xl font-semibold text-cyan-100">Settled predictions</span>
          <span className="text-sm text-cyan-300">{settledOpen ? "Hide" : "Show"}</span>
        </button>
        {settledOpen ? (
          <div className="mt-4 grid gap-3">
            {watchlist.settledPredictions.map((prediction) => (
              <PredictionRow key={prediction.id} prediction={prediction} />
            ))}
            {watchlist.settledPredictions.length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/20 p-5 text-sm text-slate-300">
                No settled predictions in this watchlist.
              </p>
            ) : null}
          </div>
        ) : null}
      </section>
    </main>
  );
}
