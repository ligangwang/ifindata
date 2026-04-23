import Link from "next/link";
import type { PublicWatchlistSummary } from "@/lib/watchlists/service";

function ownerLabel(watchlist: PublicWatchlistSummary): string {
  if (watchlist.owner.nickname) {
    return `@${watchlist.owner.nickname}`;
  }

  return watchlist.owner.displayName ?? "Analyst";
}

function watchlistReturnText(value: number | null): string {
  if (typeof value !== "number") {
    return "Not marked";
  }

  const percent = value * 100;
  const sign = percent > 0 ? "+" : "";
  return `${sign}${percent.toFixed(2)}%`;
}

function createdDateText(value: string): string {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return "Recently created";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(parsed));
}

export function PublicWatchlistsPage({ watchlists }: { watchlists: PublicWatchlistSummary[] }) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-5">
      <section className="rounded-2xl border border-cyan-500/25 bg-slate-900/70 p-4 shadow-[0_8px_40px_rgba(8,47,73,0.45)]">
        <div className="mb-4">
          <h1 className="text-lg font-semibold tracking-tight text-white sm:text-xl">Community Watchlists</h1>
          <p className="mt-1 text-sm text-slate-300">Newest public watchlists created by the YouAnalyst community.</p>
        </div>

        {watchlists.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {watchlists.map((watchlist) => (
              <article
                key={watchlist.id}
                className="rounded-xl border border-white/10 bg-slate-950/55 p-4 transition hover:border-cyan-300/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/analysts/${watchlist.owner.id}/watchlists/${watchlist.id}`}
                      className="text-base font-semibold text-cyan-200 hover:text-cyan-100"
                    >
                      {watchlist.name}
                    </Link>
                    <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                      Created {createdDateText(watchlist.createdAt)}
                    </p>
                  </div>
                  <Link
                    href={`/analysts/${watchlist.owner.id}`}
                    className="shrink-0 text-xs font-medium text-cyan-300 hover:text-cyan-100"
                  >
                    {ownerLabel(watchlist)}
                  </Link>
                </div>

                {watchlist.description ? (
                  <p className="mt-3 text-sm leading-6 text-slate-300">{watchlist.description}</p>
                ) : (
                  <p className="mt-3 text-sm text-slate-400">No description yet.</p>
                )}

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl border border-white/10 bg-slate-900/70 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Live return</p>
                    <p className="mt-1 font-semibold text-cyan-100">{watchlistReturnText(watchlist.metrics.liveReturn)}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-slate-900/70 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Settled return</p>
                    <p className="mt-1 font-semibold text-cyan-100">{watchlistReturnText(watchlist.metrics.settledReturn)}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-slate-900/70 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Live</p>
                    <p className="mt-1 font-semibold text-slate-100">
                      {watchlist.metrics.livePredictionCount.toLocaleString()} predictions
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-slate-900/70 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Settled</p>
                    <p className="mt-1 font-semibold text-slate-100">
                      {watchlist.metrics.settledPredictionCount.toLocaleString()} predictions
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-white/20 p-5 text-sm text-slate-300">
            No public watchlists yet.
          </p>
        )}
      </section>
    </main>
  );
}
