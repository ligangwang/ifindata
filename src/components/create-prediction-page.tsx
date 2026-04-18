"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { TickerSearchInput } from "@/components/ticker-search-input";
import { MAX_PREDICTION_THESIS_LENGTH, MIN_PREDICTION_THESIS_LENGTH } from "@/lib/predictions/types";

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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidTicker = isValidTickerFormat(ticker);
  const trimmedThesisLength = thesis.trim().length;
  const isValidThesis =
    trimmedThesisLength >= MIN_PREDICTION_THESIS_LENGTH &&
    trimmedThesisLength <= MAX_PREDICTION_THESIS_LENGTH;
  const tickerErrorMessage = ticker && !isValidTicker
    ? "Ticker must be 1-12 letters, numbers, dots, or hyphens."
    : null;
  const thesisErrorMessage =
    thesis && trimmedThesisLength < MIN_PREDICTION_THESIS_LENGTH
      ? `Thesis must be at least ${MIN_PREDICTION_THESIS_LENGTH} characters.`
      : trimmedThesisLength > MAX_PREDICTION_THESIS_LENGTH
        ? `Thesis must be ${MAX_PREDICTION_THESIS_LENGTH} characters or fewer.`
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

    if (!isValidThesis) {
      setError(thesisErrorMessage ?? `Thesis must be at least ${MIN_PREDICTION_THESIS_LENGTH} characters.`);
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
            <label className="text-sm text-slate-200" htmlFor="prediction-thesis">Thesis</label>
            <textarea
              id="prediction-thesis"
              value={thesis}
              onChange={(event) => setThesis(event.target.value)}
              rows={10}
              minLength={MIN_PREDICTION_THESIS_LENGTH}
              maxLength={MAX_PREDICTION_THESIS_LENGTH}
              required
              className="min-h-56 rounded-xl border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none ring-cyan-400/40 focus:ring"
              placeholder="Explain why this setup should work"
            />
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <p className={thesisErrorMessage ? "text-rose-300" : "text-slate-400"}>
                Minimum {MIN_PREDICTION_THESIS_LENGTH} characters.
              </p>
              <p className={trimmedThesisLength < MIN_PREDICTION_THESIS_LENGTH ? "text-slate-400" : "text-emerald-300"}>
                {trimmedThesisLength}/{MIN_PREDICTION_THESIS_LENGTH}
              </p>
            </div>
            {thesisErrorMessage ? <p className="text-xs text-rose-300">{thesisErrorMessage}</p> : null}
          </div>

          <button
            type="button"
            onClick={() => void submit()}
            disabled={submitting || !isValidTicker || !isValidThesis}
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
