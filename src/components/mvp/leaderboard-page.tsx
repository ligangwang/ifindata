"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type LeaderboardEntry = {
  userId: string;
  displayName: string | null;
  totalScore: number;
  closedPredictions: number;
};

type LeaderboardResponse = {
  items: LeaderboardEntry[];
};

function scoreText(score: number): string {
  const sign = score > 0 ? "+" : "";
  return `${sign}${Math.round(score)}`;
}

export function LeaderboardPage() {
  const [payload, setPayload] = useState<LeaderboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void fetch("/api/leaderboard?limit=100")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Unable to load leaderboard.");
        }

        const nextPayload = (await response.json()) as LeaderboardResponse;
        if (!cancelled) {
          setPayload(nextPayload);
        }
      })
      .catch((nextError) => {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : "Unable to load leaderboard.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!payload) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-8 text-sm text-slate-300">
        {error ?? "Loading leaderboard..."}
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <section className="rounded-2xl border border-cyan-500/25 bg-slate-900/70 p-5">
        <h1 className="font-[var(--font-sora)] text-2xl font-semibold text-cyan-100">Leaderboard</h1>
        <p className="mb-4 text-sm text-slate-300">Analysts ranked by total score in basis points.</p>

        <div className="grid gap-2">
          {payload.items.map((entry, index) => (
            <Link
              key={entry.userId}
              href={`/analysts/${entry.userId}`}
              className="flex flex-col gap-2 rounded-xl border border-white/10 p-3 hover:border-cyan-300/60 sm:grid sm:grid-cols-[auto_1fr_auto_auto] sm:items-center"
            >
              <p className="text-sm font-semibold text-cyan-200">#{index + 1}</p>
              <p className="text-sm text-slate-100">{entry.displayName ?? "Anonymous"}</p>
              <p className="text-sm text-emerald-200 sm:text-right">{scoreText(entry.totalScore)}</p>
              <p className="text-xs text-slate-400 sm:text-right">{entry.closedPredictions} closed</p>
            </Link>
          ))}

          {payload.items.length === 0 ? <p className="text-sm text-slate-300">No analysts yet.</p> : null}
        </div>
      </section>
    </main>
  );
}
