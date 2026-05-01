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

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!normalizedTicker) {
      setError("Enter a ticker or company name.");
      return;
    }

    if (!isValidTicker(normalizedTicker)) {
      setError("Choose a ticker from search or enter a valid symbol.");
      return;
    }

    router.push(`/ticker/${encodeURIComponent(normalizedTicker)}`);
  }

  return (
    <form
      onSubmit={submitSearch}
      className="mt-4 rounded-2xl border border-white/15 bg-slate-950/55 p-5"
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <TickerSearchInput value={ticker} onChange={(value) => {
          setTicker(value);
          setError(null);
        }} error={error} />
        <button
          type="submit"
          className="rounded-lg bg-cyan-500 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
        >
          Open graph
        </button>
      </div>
    </form>
  );
}
