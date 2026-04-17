"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type DailyScoreCard = {
  userId: string;
  date: string;
  displayName: string | null;
  nickname: string | null;
  photoURL: string | null;
  totalScore: number;
  dailyScoreChange: number;
  openPredictions: number;
  closedPredictions: number;
  dailyMarkedPredictions: number;
  bestPredictionId: string | null;
  bestPredictionTicker: string | null;
  bestPredictionScoreChange: number | null;
  worstPredictionId: string | null;
  worstPredictionTicker: string | null;
  worstPredictionScoreChange: number | null;
};

type DailyScoresResponse = {
  items: DailyScoreCard[];
};

function scoreText(score: number): string {
  const sign = score > 0 ? "+" : "";
  return `${sign}${Math.round(score)} bp`;
}

function compactDate(value: string): string {
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

function displayName(card: DailyScoreCard): string {
  return card.nickname ? `@${card.nickname}` : card.displayName ?? "Anonymous";
}

function absoluteUrl(path: string): string {
  if (typeof window === "undefined") {
    return path;
  }
  return `${window.location.origin}${path}`;
}

function cardPath(card: DailyScoreCard): string {
  return `/daily?date=${encodeURIComponent(card.date)}&userId=${encodeURIComponent(card.userId)}`;
}

function shareText(card: DailyScoreCard): string {
  const best = card.bestPredictionTicker && card.bestPredictionScoreChange !== null
    ? ` Top call: ${card.bestPredictionTicker} ${scoreText(card.bestPredictionScoreChange)}.`
    : "";

  return `${displayName(card)} moved ${scoreText(card.dailyScoreChange)} on YouAnalyst for ${compactDate(card.date)}.${best} Total score: ${scoreText(card.totalScore)}.`;
}

function DailyScoreCardView({
  card,
  copiedKey,
  onCopy,
  onShare,
}: {
  card: DailyScoreCard;
  copiedKey: string | null;
  onCopy: (card: DailyScoreCard) => void;
  onShare: (card: DailyScoreCard) => void;
}) {
  const name = displayName(card);
  const key = `${card.userId}_${card.date}`;
  const positiveMove = card.dailyScoreChange >= 0;

  return (
    <article className="rounded-xl border border-white/10 bg-slate-950/55 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase text-slate-500">{compactDate(card.date)}</p>
          <Link href={`/analysts/${card.userId}`} className="mt-1 block truncate text-sm font-semibold text-cyan-200 hover:text-cyan-100">
            {name}
          </Link>
        </div>
        <p className={`text-right font-[var(--font-sora)] text-2xl font-semibold ${positiveMove ? "text-emerald-300" : "text-rose-300"}`}>
          {scoreText(card.dailyScoreChange)}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-lg border border-white/10 p-2">
          <p className="text-slate-500">Total</p>
          <p className="mt-1 font-semibold text-slate-100">{scoreText(card.totalScore)}</p>
        </div>
        <div className="rounded-lg border border-white/10 p-2">
          <p className="text-slate-500">Open</p>
          <p className="mt-1 font-semibold text-slate-100">{card.openPredictions}</p>
        </div>
        <div className="rounded-lg border border-white/10 p-2">
          <p className="text-slate-500">Closed</p>
          <p className="mt-1 font-semibold text-slate-100">{card.closedPredictions}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 text-xs text-slate-300">
        <p>{card.dailyMarkedPredictions} predictions marked today.</p>
        {card.bestPredictionTicker && card.bestPredictionScoreChange !== null ? (
          <p>
            Best:{" "}
            {card.bestPredictionId ? (
              <Link href={`/predictions/${card.bestPredictionId}`} className="text-cyan-300 hover:text-cyan-100">
                {card.bestPredictionTicker}
              </Link>
            ) : (
              card.bestPredictionTicker
            )}{" "}
            <span className="text-emerald-300">{scoreText(card.bestPredictionScoreChange)}</span>
          </p>
        ) : null}
        {card.worstPredictionTicker && card.worstPredictionScoreChange !== null ? (
          <p>
            Worst:{" "}
            {card.worstPredictionId ? (
              <Link href={`/predictions/${card.worstPredictionId}`} className="text-cyan-300 hover:text-cyan-100">
                {card.worstPredictionTicker}
              </Link>
            ) : (
              card.worstPredictionTicker
            )}{" "}
            <span className="text-rose-300">{scoreText(card.worstPredictionScoreChange)}</span>
          </p>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onShare(card)}
          className="rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-400"
        >
          Share
        </button>
        <button
          type="button"
          onClick={() => onCopy(card)}
          className="rounded-lg border border-cyan-400/35 px-3 py-1.5 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/15"
        >
          Copy link
        </button>
        {copiedKey === key ? <span className="text-xs text-emerald-300">Copied</span> : null}
      </div>
    </article>
  );
}

export function DailyScoresPage() {
  const [items, setItems] = useState<DailyScoreCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const apiPath = useMemo(() => {
    if (typeof window === "undefined") {
      return "/api/daily-scores?limit=60";
    }

    const params = new URLSearchParams(window.location.search);
    const date = params.get("date");
    const userId = params.get("userId");
    const apiParams = new URLSearchParams();
    apiParams.set("limit", "60");
    if (date) {
      apiParams.set("date", date);
    }
    if (userId) {
      apiParams.set("userId", userId);
    }
    return `/api/daily-scores?${apiParams.toString()}`;
  }, []);

  useEffect(() => {
    let cancelled = false;

    void fetch(apiPath)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Unable to load daily moves.");
        }

        const payload = (await response.json()) as DailyScoresResponse;
        if (!cancelled) {
          setItems(payload.items);
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

  async function copyCard(card: DailyScoreCard) {
    const key = `${card.userId}_${card.date}`;
    try {
      await navigator.clipboard.writeText(absoluteUrl(cardPath(card)));
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      setCopiedKey(null);
    }
  }

  async function shareCard(card: DailyScoreCard) {
    const url = absoluteUrl(cardPath(card));
    const text = shareText(card);

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${displayName(card)} daily move on YouAnalyst`,
          text,
          url,
        });
        return;
      } catch {
        return;
      }
    }

    await copyCard(card);
  }

  const grouped = items.reduce<Record<string, DailyScoreCard[]>>((groups, item) => {
    groups[item.date] = [...(groups[item.date] ?? []), item];
    return groups;
  }, {});

  if (loading) {
    return <main className="mx-auto w-full max-w-6xl px-4 py-8 text-sm text-slate-300">Loading daily moves...</main>;
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <section className="rounded-xl border border-cyan-500/25 bg-slate-900/70 p-5">
        <h1 className="font-[var(--font-sora)] text-2xl font-semibold text-cyan-100">Daily Moves</h1>
        <p className="mt-2 text-sm text-slate-300">
          Shareable analyst score cards from end-of-day prediction marks.
        </p>
      </section>

      {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}

      <div className="mt-4 grid gap-5">
        {Object.entries(grouped).map(([date, cards]) => (
          <section key={date}>
            <h2 className="mb-3 font-[var(--font-sora)] text-lg font-semibold text-cyan-100">{compactDate(date)}</h2>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {cards.map((card) => (
                <DailyScoreCardView
                  key={`${card.userId}_${card.date}`}
                  card={card}
                  copiedKey={copiedKey}
                  onCopy={(nextCard) => void copyCard(nextCard)}
                  onShare={(nextCard) => void shareCard(nextCard)}
                />
              ))}
            </div>
          </section>
        ))}

        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/20 p-5 text-sm text-slate-300">
            No daily moves yet. They will appear after the EOD job writes daily score snapshots.
          </p>
        ) : null}
      </div>
    </main>
  );
}
