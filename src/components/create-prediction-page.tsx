"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { PredictionThesisText } from "@/components/prediction-ui";
import { TickerSearchInput } from "@/components/ticker-search-input";

function isValidTickerFormat(ticker: string): boolean {
  if (!ticker || ticker.length === 0 || ticker.length > 12) {
    return false;
  }
  return /^[A-Z0-9.\-]+$/.test(ticker);
}

export function CreatePredictionPage() {
  const router = useRouter();
  const { user, loading, getIdToken } = useAuth();
  const [ticker, setTicker] = useState("");
  const [direction, setDirection] = useState<"UP" | "DOWN">("UP");
  const [thesis, setThesis] = useState("");
  const [thesisMode, setThesisMode] = useState<"WRITE" | "PREVIEW">("WRITE");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidTicker = isValidTickerFormat(ticker);
  const tickerErrorMessage = ticker && !isValidTicker
    ? "Ticker must be 1-12 letters, numbers, dots, or hyphens."
    : null;

  if (loading) {
    return <main className="mx-auto w-full max-w-3xl px-4 py-8 text-sm text-slate-300">Loading...</main>;
  }

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <section className="rounded-2xl border border-cyan-500/25 bg-slate-900/70 p-6 text-center shadow-[0_8px_40px_rgba(8,47,73,0.45)]">
          <h1 className="mb-2 font-[var(--font-sora)] text-2xl font-semibold text-cyan-100">Sign in to create a prediction</h1>
          <p className="mb-6 text-sm text-slate-300">You need to be signed in to publish predictions and build your score.</p>
          <button
            type="button"
            onClick={() => router.push("/auth")}
            className="rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-900"
          >
            Sign in
          </button>
        </section>
      </main>
    );
  }

  async function submit() {
    setError(null);

    if (!isValidTicker) {
      setError("Invalid ticker format.");
      return;
    }

    const token = await getIdToken();
    if (!token) {
      setError("Authentication required.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/predictions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ticker,
          direction,
          thesis,
          visibility: "PUBLIC",
        }),
      });

      const payload = (await response.json()) as { id?: string; error?: string };
      if (!response.ok || !payload.id) {
        throw new Error(payload.error ?? "Failed to create prediction");
      }

      router.push(`/predictions/${payload.id}`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to create prediction");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <section className="rounded-2xl border border-cyan-500/25 bg-slate-900/70 p-6 shadow-[0_8px_40px_rgba(8,47,73,0.45)]">
        <h1 className="mb-2 font-[var(--font-sora)] text-2xl font-semibold text-cyan-100">Create prediction</h1>
        <p className="mb-6 text-sm text-slate-300">Open your thesis with a direction. Entry price is captured server-side.</p>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <TickerSearchInput
              value={ticker}
              onChange={setTicker}
              error={tickerErrorMessage}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-slate-200">Direction</label>
            <div className="inline-flex w-full rounded-full border border-white/15 p-1 sm:w-fit">
              {(["UP", "DOWN"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setDirection(option)}
                  className={`flex-1 rounded-full px-3 py-1.5 text-sm sm:flex-none ${direction === option ? "bg-cyan-400 text-slate-900" : "text-slate-200"}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-sm text-slate-200">Thesis (optional)</label>
              <div className="inline-flex rounded-lg border border-white/15 p-1 text-xs">
                {(["WRITE", "PREVIEW"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setThesisMode(mode)}
                    className={`rounded-md px-2.5 py-1 ${thesisMode === mode ? "bg-cyan-400 text-slate-900" : "text-slate-300"}`}
                  >
                    {mode === "WRITE" ? "Write" : "Preview"}
                  </button>
                ))}
              </div>
            </div>
            {thesisMode === "WRITE" ? (
              <textarea
                value={thesis}
                onChange={(event) => setThesis(event.target.value)}
                rows={10}
                className="min-h-56 rounded-xl border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none ring-cyan-400/40 focus:ring"
                placeholder="Why this setup should work"
              />
            ) : (
              <div className="min-h-56 rounded-xl border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-slate-100">
                <PredictionThesisText text={thesis} fallback="Nothing to preview yet." />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => void submit()}
            disabled={submitting || !isValidTicker}
            className="w-full rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-900 disabled:opacity-60 sm:w-fit"
          >
            {submitting ? "Publishing..." : "Publish prediction"}
          </button>

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        </div>
      </section>
    </main>
  );
}
