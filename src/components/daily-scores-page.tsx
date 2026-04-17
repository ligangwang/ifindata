"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type DailyUserGainer = {
  userId: string;
  displayName: string | null;
  nickname: string | null;
  photoURL: string | null;
  totalScore: number;
  dailyScoreChange: number;
  dailyMarkedPredictions: number;
};

type DailyPredictionGainer = {
  predictionId: string;
  userId: string;
  displayName: string | null;
  nickname: string | null;
  ticker: string | null;
  direction: string | null;
  score: number;
  scoreChange: number;
  status: string | null;
};

type DailyScoresResponse = {
  date: string | null;
  userGainers: DailyUserGainer[];
  predictionGainers: DailyPredictionGainer[];
};

function scoreText(score: number): string {
  const sign = score > 0 ? "+" : "";
  return `${sign}${Math.round(score)} bp`;
}

function compactDate(value: string | null): string {
  if (!value) {
    return "Latest day";
  }

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function userName(user: { displayName: string | null; nickname: string | null }): string {
  return user.nickname ? `@${user.nickname}` : user.displayName ?? "Anonymous";
}

function absoluteUrl(path: string): string {
  if (typeof window === "undefined") {
    return path;
  }
  return `${window.location.origin}${path}`;
}

function dailyPath(date: string | null): string {
  return date ? `/daily?date=${encodeURIComponent(date)}` : "/daily";
}

function shareText(payload: DailyScoresResponse): string {
  const topUser = payload.userGainers[0];
  const topPrediction = payload.predictionGainers[0];
  const userPart = topUser ? `Top analyst: ${userName(topUser)} ${scoreText(topUser.dailyScoreChange)}.` : "";
  const predictionPart = topPrediction
    ? ` Top prediction: ${topPrediction.ticker ?? "Prediction"} ${scoreText(topPrediction.scoreChange)}.`
    : "";

  return `YouAnalyst daily moves for ${compactDate(payload.date)}. ${userPart}${predictionPart}`;
}

export function DailyScoresPage() {
  const [payload, setPayload] = useState<DailyScoresResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const apiPath = useMemo(() => {
    if (typeof window === "undefined") {
      return "/api/daily-scores";
    }

    const date = new URLSearchParams(window.location.search).get("date");
    return date ? `/api/daily-scores?date=${encodeURIComponent(date)}` : "/api/daily-scores";
  }, []);

  useEffect(() => {
    let cancelled = false;

    void fetch(apiPath)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Unable to load daily moves.");
        }

        const nextPayload = (await response.json()) as DailyScoresResponse;
        if (!cancelled) {
          setPayload(nextPayload);
        }
      })
      .catch((nextError) => {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : "Unable to load daily moves.");
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
  }, [apiPath]);

  async function copyDailyLink() {
    if (!payload) {
      return;
    }

    try {
      await navigator.clipboard.writeText(absoluteUrl(dailyPath(payload.date)));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  async function shareDaily() {
    if (!payload) {
      return;
    }

    const url = absoluteUrl(dailyPath(payload.date));

    if (navigator.share) {
      try {
        await navigator.share({
          title: `YouAnalyst daily moves for ${compactDate(payload.date)}`,
          text: shareText(payload),
          url,
        });
        return;
      } catch {
        return;
      }
    }

    await copyDailyLink();
  }

  if (loading) {
    return <main className="mx-auto w-full max-w-6xl px-4 py-8 text-sm text-slate-300">Loading daily moves...</main>;
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <section className="rounded-xl border border-cyan-500/25 bg-slate-900/70 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase text-slate-500">{compactDate(payload?.date ?? null)}</p>
            <h1 className="mt-1 font-[var(--font-sora)] text-2xl font-semibold text-cyan-100">Daily Moves</h1>
            <p className="mt-2 text-sm text-slate-300">
              Sitewide score highlights from the latest end-of-day prediction marks.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void shareDaily()}
              className="rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-400"
            >
              Share
            </button>
            <button
              type="button"
              onClick={() => void copyDailyLink()}
              className="rounded-lg border border-cyan-400/35 px-3 py-1.5 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/15"
            >
              Copy link
            </button>
            {copied ? <span className="self-center text-xs text-emerald-300">Copied</span> : null}
          </div>
        </div>
      </section>

      {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}

      {payload ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <section className="rounded-xl border border-white/10 bg-slate-950/55 p-4">
            <h2 className="font-[var(--font-sora)] text-lg font-semibold text-cyan-100">Top Analysts</h2>
            <div className="mt-3 grid gap-2">
              {payload.userGainers.map((user, index) => (
                <Link
                  key={user.userId}
                  href={`/analysts/${user.userId}`}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg border border-white/10 p-3 hover:border-cyan-300/60"
                >
                  <span className="text-sm font-semibold text-cyan-200">#{index + 1}</span>
                  <span className="min-w-0 truncate text-sm text-slate-100">{userName(user)}</span>
                  <span className="text-sm font-semibold text-emerald-300">{scoreText(user.dailyScoreChange)}</span>
                </Link>
              ))}
              {payload.userGainers.length === 0 ? <p className="text-sm text-slate-300">No analyst moves yet.</p> : null}
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-slate-950/55 p-4">
            <h2 className="font-[var(--font-sora)] text-lg font-semibold text-cyan-100">Top Predictions</h2>
            <div className="mt-3 grid gap-2">
              {payload.predictionGainers.map((prediction, index) => (
                <Link
                  key={prediction.predictionId}
                  href={`/predictions/${prediction.predictionId}`}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg border border-white/10 p-3 hover:border-cyan-300/60"
                >
                  <span className="text-sm font-semibold text-cyan-200">#{index + 1}</span>
                  <span className="min-w-0 text-sm text-slate-100">
                    <span className="font-semibold">{prediction.ticker ?? "Prediction"}</span>
                    <span className="text-slate-500"> / </span>
                    <span>{prediction.direction ?? "N/A"}</span>
                    <span className="text-slate-500"> / </span>
                    <span>{userName(prediction)}</span>
                  </span>
                  <span className="text-sm font-semibold text-emerald-300">{scoreText(prediction.scoreChange)}</span>
                </Link>
              ))}
              {payload.predictionGainers.length === 0 ? <p className="text-sm text-slate-300">No prediction moves yet.</p> : null}
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
