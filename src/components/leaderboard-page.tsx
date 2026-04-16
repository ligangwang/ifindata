"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type LeaderboardEntry = {
  userId: string;
  displayName: string | null;
  nickname: string | null;
  photoURL: string | null;
  totalScore: number;
};

type LeaderboardResponse = {
  items: LeaderboardEntry[];
};

function scoreText(score: number): string {
  const sign = score > 0 ? "+" : "";
  return `${sign}${Math.round(score)}`;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "A";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase();
  }
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
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
          {payload.items.map((entry, index) => {
            const displayName = entry.nickname ? `@${entry.nickname}` : entry.displayName ?? "Anonymous";

            return (
              <Link
                key={entry.userId}
                href={`/analysts/${entry.userId}`}
                className="grid grid-cols-[auto_auto_1fr_auto] items-center gap-3 rounded-xl border border-white/10 p-3 hover:border-cyan-300/60"
              >
                <p className="text-sm font-semibold text-cyan-200">#{index + 1}</p>
                {entry.photoURL ? (
                  <Image
                    src={entry.photoURL}
                    alt={`${displayName} avatar`}
                    width={36}
                    height={36}
                    className="h-9 w-9 rounded-full object-cover ring-1 ring-cyan-400/40"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-cyan-600/25 text-sm font-semibold text-cyan-100 ring-1 ring-cyan-400/40">
                    {initials(displayName)}
                  </span>
                )}
                <p className="min-w-0 truncate text-sm text-slate-100">{displayName}</p>
                <p className="text-sm font-semibold text-emerald-200">{scoreText(entry.totalScore)}</p>
              </Link>
            );
          })}

          {payload.items.length === 0 ? <p className="text-sm text-slate-300">No analysts yet.</p> : null}
        </div>
      </section>
    </main>
  );
}
