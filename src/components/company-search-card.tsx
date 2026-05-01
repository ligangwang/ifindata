"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { TickerSearchInput } from "@/components/ticker-search-input";

function normalizeTicker(value: string): string {
  return value.trim().replace(/^\$/, "").toUpperCase();
}

function isValidTicker(value: string): boolean {
  return /^[A-Z0-9][A-Z0-9.-]{0,9}$/.test(value);
}

export function CompanySearchCard() {
  const router = useRouter();
  const [ticker, setTicker] = useState("");
  const normalizedTicker = normalizeTicker(ticker);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!normalizedTicker) {
      setError("Enter a ticker or company name.");
      setMessage(null);
      return;
    }

    if (!isValidTicker(normalizedTicker)) {
      setError("Choose a ticker from search or enter a valid symbol.");
      setMessage(null);
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/company-graph/requests", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          ticker: normalizedTicker,
        }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
        status?: "AVAILABLE" | "QUEUED" | "ALREADY_QUEUED";
        ticker?: string;
      };

      if (!response.ok) {
        throw new Error(body.error ?? "Unable to request company graph.");
      }

      if (body.status === "AVAILABLE") {
        router.push(`/ticker/${encodeURIComponent(body.ticker ?? normalizedTicker)}`);
        return;
      }

      setMessage(body.message ?? `${normalizedTicker} was added to the graph request queue.`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to request company graph.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={submitSearch}
      className="mt-6 rounded-2xl border border-cyan-400/20 bg-slate-950/70 p-3 shadow-[0_12px_44px_rgba(8,47,73,0.22)] sm:p-4"
    >
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <TickerSearchInput
          value={ticker}
          onChange={(value) => {
            setTicker(value);
            setError(null);
            setMessage(null);
          }}
          error={error}
          hideLabel
          label="Company or ticker"
          showHelperText={false}
        />
        <button
          type="submit"
          disabled={submitting}
          className="h-11 rounded-xl bg-cyan-500 px-5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Checking..." : "Open graph"}
        </button>
      </div>
      {message ? <p className="mt-3 text-sm text-emerald-200">{message}</p> : null}
    </form>
  );
}
