"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";

export function CreatePredictionPage() {
  const router = useRouter();
  const { user, getIdToken } = useAuth();
  const [ticker, setTicker] = useState("");
  const [direction, setDirection] = useState<"UP" | "DOWN">("UP");
  const [expiryAt, setExpiryAt] = useState("");
  const [thesis, setThesis] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);

    if (!user) {
      router.push("/auth");
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
          expiryAt: new Date(expiryAt).toISOString(),
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
        <p className="mb-6 text-sm text-slate-300">Publish your thesis with direction and expiry. Entry price is captured server-side.</p>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm text-slate-200">Ticker</label>
            <input
              value={ticker}
              onChange={(event) => setTicker(event.target.value.toUpperCase())}
              placeholder="AAPL"
              className="rounded-xl border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none ring-cyan-400/40 focus:ring"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-slate-200">Direction</label>
            <div className="inline-flex w-fit rounded-full border border-white/15 p-1">
              {(["UP", "DOWN"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setDirection(option)}
                  className={`rounded-full px-3 py-1.5 text-sm ${direction === option ? "bg-cyan-400 text-slate-900" : "text-slate-200"}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-slate-200">Expiry</label>
            <input
              type="datetime-local"
              value={expiryAt}
              onChange={(event) => setExpiryAt(event.target.value)}
              className="rounded-xl border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none ring-cyan-400/40 focus:ring"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-slate-200">Thesis (optional)</label>
            <textarea
              value={thesis}
              onChange={(event) => setThesis(event.target.value)}
              rows={6}
              className="rounded-xl border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none ring-cyan-400/40 focus:ring"
              placeholder="Why this setup should work"
            />
          </div>

          <button
            type="button"
            onClick={() => void submit()}
            disabled={submitting || !ticker || !expiryAt}
            className="w-fit rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-900 disabled:opacity-60"
          >
            {submitting ? "Publishing..." : "Publish prediction"}
          </button>

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        </div>
      </section>
    </main>
  );
}
