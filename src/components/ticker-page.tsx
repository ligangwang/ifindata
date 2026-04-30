"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatTickerSymbol, PredictionAuthorSummary, PredictionReturnSummary } from "@/components/prediction-ui";
import { useAuth } from "@/components/providers/auth-provider";
import { type PredictionStatus } from "@/lib/predictions/types";

type Prediction = {
  id: string;
  userId: string;
  authorDisplayName: string | null;
  authorNickname: string | null;
  authorPhotoURL: string | null;
  authorStats?: {
    level?: number | null;
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
  markReturnValue?: number | null;
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

type GraphNode = {
  id: string;
  label: string;
  sublabel: string;
  x: number;
  y: number;
  tone: "cyan" | "emerald" | "slate";
};

function relationNodes(displayTicker: string, predictions: Prediction[]): GraphNode[] {
  const bullishCount = predictions.filter((prediction) => prediction.direction === "UP").length;
  const bearishCount = predictions.filter((prediction) => prediction.direction === "DOWN").length;
  const liveCount = predictions.filter((prediction) => ["CREATED", "OPEN", "CLOSING"].includes(prediction.status)).length;
  const settledCount = predictions.filter((prediction) => prediction.status === "SETTLED").length;
  const uniqueAnalystCount = new Set(predictions.map((prediction) => prediction.userId).filter(Boolean)).size;

  return [
    {
      id: "theme",
      label: "Market themes",
      sublabel: "AI, margins, demand, macro",
      x: 50,
      y: 18,
      tone: "cyan",
    },
    {
      id: "peers",
      label: "Peer set",
      sublabel: "Competitors and substitutes",
      x: 78,
      y: 45,
      tone: "slate",
    },
    {
      id: "supply",
      label: "Value chain",
      sublabel: "Suppliers, customers, channels",
      x: 50,
      y: 76,
      tone: "slate",
    },
    {
      id: "calls",
      label: "Public calls",
      sublabel: `${bullishCount} bullish - ${bearishCount} bearish`,
      x: 22,
      y: 45,
      tone: "emerald",
    },
    {
      id: "activity",
      label: "Track record",
      sublabel: `${liveCount} live - ${settledCount} settled - ${uniqueAnalystCount} analysts`,
      x: 22,
      y: 72,
      tone: "cyan",
    },
    {
      id: "company",
      label: displayTicker,
      sublabel: "Company node",
      x: 50,
      y: 45,
      tone: "emerald",
    },
  ];
}

function toneClass(tone: GraphNode["tone"]): string {
  if (tone === "emerald") {
    return "border-emerald-300/50 bg-emerald-400/10 text-emerald-100";
  }
  if (tone === "cyan") {
    return "border-cyan-300/50 bg-cyan-400/10 text-cyan-100";
  }
  return "border-white/15 bg-slate-900 text-slate-200";
}

function KnowledgeGraph({
  displayTicker,
  predictions,
  locked,
}: {
  displayTicker: string;
  predictions: Prediction[];
  locked: boolean;
}) {
  const nodes = relationNodes(displayTicker, predictions);
  const center = nodes.find((node) => node.id === "company") ?? nodes[nodes.length - 1];
  const visibleNodes = locked ? nodes.filter((node) => node.id === "company" || node.id === "theme" || node.id === "activity") : nodes;

  return (
    <div className="relative min-h-[360px] overflow-hidden rounded-2xl border border-white/10 bg-slate-950/65">
      <svg className="absolute inset-0 h-full w-full" aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none">
        {visibleNodes
          .filter((node) => node.id !== "company")
          .map((node) => (
            <line
              key={`${center.id}-${node.id}`}
              x1={center.x}
              y1={center.y}
              x2={node.x}
              y2={node.y}
              stroke="rgba(103, 232, 249, 0.28)"
              strokeWidth="0.45"
            />
          ))}
      </svg>
      <div className={locked ? "absolute inset-0 blur-[1px]" : "absolute inset-0"}>
        {visibleNodes.map((node) => (
          <div
            key={node.id}
            className={`absolute w-[min(44vw,220px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border px-4 py-3 shadow-[0_12px_35px_rgba(2,6,23,0.45)] ${toneClass(node.tone)}`}
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
          >
            <p className="font-[var(--font-sora)] text-sm font-semibold">{node.label}</p>
            <p className="mt-1 text-xs leading-5 text-slate-300">{node.sublabel}</p>
          </div>
        ))}
      </div>
      {locked ? (
        <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-cyan-400/30 bg-slate-950/90 p-4 shadow-[0_12px_40px_rgba(2,6,23,0.7)]">
          <h3 className="font-[var(--font-sora)] text-lg font-semibold text-cyan-100">Company graph preview</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            Sign in to explore the full company graph, related calls, watchlists, and relationship context.
          </p>
          <Link
            href="/auth"
            className="mt-4 inline-flex rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
          >
            Sign in to explore more
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export function TickerPage({ ticker }: { ticker: string }) {
  const { user, loading: authLoading } = useAuth();
  const [payload, setPayload] = useState<TickerResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const displayTicker = formatTickerSymbol(payload?.ticker ?? ticker);
  const graphLocked = authLoading || !user;

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
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <section className="rounded-2xl border border-cyan-500/25 bg-slate-900/70 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">Company</p>
            <h1 className="mt-2 font-[var(--font-sora)] text-4xl font-semibold text-cyan-100">{displayTicker}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
              Public calls, watchlists, and relationship context for {displayTicker}.
            </p>
          </div>
          <Link
            href={`/predictions/new?ticker=${encodeURIComponent(payload.ticker)}`}
            className="w-full rounded-lg bg-cyan-500 px-4 py-2 text-center text-sm font-semibold text-slate-950 hover:bg-cyan-400 sm:w-auto"
          >
            Make your call
          </Link>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-white/15 bg-slate-950/55 p-5">
        <div className="mb-4 flex flex-col gap-1">
          <h2 className="font-[var(--font-sora)] text-xl font-semibold text-cyan-100">Knowledge graph</h2>
          <p className="text-sm text-slate-400">
            Map company relationships, market themes, and YouAnalyst activity around {displayTicker}.
          </p>
        </div>
        <KnowledgeGraph displayTicker={displayTicker} predictions={payload.items} locked={graphLocked} />
      </section>

      <section className="mt-4 rounded-2xl border border-white/15 bg-slate-950/55 p-5">
        <h2 className="mb-3 font-[var(--font-sora)] text-xl font-semibold text-cyan-100">Predictions</h2>
        <div className="grid gap-2">
          {payload.items.map((prediction) => (
            <article
              key={prediction.id}
              className="rounded-xl border border-white/10 p-4 hover:border-cyan-300/60"
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <Link
                  href={`/ticker/${payload.ticker}`}
                  className="flex w-fit items-center gap-1 text-base font-semibold text-cyan-200 hover:text-cyan-100"
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
