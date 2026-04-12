"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Prediction = {
  id: string;
  ticker: string;
  direction: "UP" | "DOWN";
  createdAt: string;
  status: "ACTIVE" | "SETTLED";
  result: {
    score: number;
  } | null;
};

type ProfilePayload = {
  profile: {
    id: string;
    displayName: string | null;
    bio: string;
    stats: {
      totalPredictions: number;
      activePredictions: number;
      settledPredictions: number;
      totalScore: number;
    };
  };
  predictions: Prediction[];
};

function scoreText(score: number): string {
  const sign = score > 0 ? "+" : "";
  return `${sign}${(score / 100).toFixed(2)}%`;
}

export function AnalystProfilePage({ userId }: { userId: string }) {
  const [payload, setPayload] = useState<ProfilePayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void fetch(`/api/users/${userId}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Unable to load analyst profile.");
        }

        const nextPayload = (await response.json()) as ProfilePayload;
        if (!cancelled) {
          setPayload(nextPayload);
        }
      })
      .catch((nextError) => {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : "Unable to load profile.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!payload) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-8 text-sm text-slate-300">
        {error ?? "Loading profile..."}
      </main>
    );
  }

  return (
    <main className="mx-auto grid w-full max-w-5xl gap-4 px-4 py-8">
      <section className="rounded-2xl border border-cyan-500/25 bg-slate-900/70 p-5">
        <h1 className="font-[var(--font-sora)] text-2xl font-semibold text-cyan-100">
          {payload.profile.displayName ?? "Analyst"}
        </h1>
        <p className="mt-2 text-sm text-slate-300">{payload.profile.bio || "No bio yet."}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          <div className="rounded-xl border border-white/10 p-3">
            <p className="text-slate-400">Total Score</p>
            <p className="font-semibold text-cyan-100">{scoreText(payload.profile.stats.totalScore)}</p>
          </div>
          <div className="rounded-xl border border-white/10 p-3">
            <p className="text-slate-400">Total</p>
            <p className="font-semibold text-cyan-100">{payload.profile.stats.totalPredictions}</p>
          </div>
          <div className="rounded-xl border border-white/10 p-3">
            <p className="text-slate-400">Active</p>
            <p className="font-semibold text-cyan-100">{payload.profile.stats.activePredictions}</p>
          </div>
          <div className="rounded-xl border border-white/10 p-3">
            <p className="text-slate-400">Settled</p>
            <p className="font-semibold text-cyan-100">{payload.profile.stats.settledPredictions}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/15 bg-slate-950/55 p-5">
        <h2 className="mb-3 font-[var(--font-sora)] text-lg font-semibold text-cyan-100">Prediction history</h2>
        <div className="grid gap-2">
          {payload.predictions.map((prediction) => (
            <Link
              key={prediction.id}
              href={`/predictions/${prediction.id}`}
              className="rounded-xl border border-white/10 p-3 hover:border-cyan-300/60"
            >
              <p className="text-sm text-slate-100">
                {prediction.ticker} · {prediction.direction} · {prediction.status}
              </p>
              <p className="mt-1 text-xs text-slate-400">{new Date(prediction.createdAt).toLocaleString()}</p>
              {prediction.result ? (
                <p className="mt-1 text-xs text-emerald-200">Result {scoreText(prediction.result.score)}</p>
              ) : null}
            </Link>
          ))}

          {payload.predictions.length === 0 ? <p className="text-sm text-slate-300">No predictions yet.</p> : null}
        </div>
      </section>
    </main>
  );
}
