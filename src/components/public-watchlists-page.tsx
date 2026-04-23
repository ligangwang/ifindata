import Link from "next/link";
import { formatTickerSymbol, PredictionReturnSummary } from "@/components/prediction-ui";
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

function predictionStatusLabel(status: PublicWatchlistSummary["previewPredictions"][number]["status"]): string {
  if (status === "CREATED") {
    return "Awaiting entry";
  }
  if (status === "OPEN") {
    return "Live";
  }
  if (status === "CLOSING") {
    return "Closing";
  }
  return "Settled";
}

function WatchlistPreviewRow({
  prediction,
  watchlistId,
}: {
  prediction: PublicWatchlistSummary["previewPredictions"][number];
  watchlistId: string;
}) {
  return (
    <article className="border-t border-white/10 py-3 first:border-t-0 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link
            href={`/predictions/${prediction.id}`}
            className="flex w-fit items-center gap-1 text-sm font-semibold text-cyan-200 hover:text-cyan-100"
            aria-label={`${prediction.direction === "UP" ? "Up" : "Down"} prediction for ${prediction.ticker} in watchlist ${watchlistId}`}
          >
            <span aria-hidden="true">{prediction.direction === "UP" ? "\u2191" : "\u2193"}</span>
            <span>{formatTickerSymbol(prediction.ticker)}</span>
          </Link>
          <PredictionReturnSummary prediction={prediction} href={`/predictions/${prediction.id}`} status={prediction.status} />
        </div>
        <div className="shrink-0 text-right text-xs text-slate-500">
          <p>{predictionStatusLabel(prediction.status)}</p>
          <p className="mt-1">{prediction.commentCount.toLocaleString()} comments</p>
        </div>
      </div>
    </article>
  );
}

function totalPredictionCount(watchlist: PublicWatchlistSummary): number {
  return watchlist.metrics.livePredictionCount + watchlist.metrics.settledPredictionCount;
}

function hiddenPredictionCount(watchlist: PublicWatchlistSummary): number {
  return Math.max(0, totalPredictionCount(watchlist) - watchlist.previewPredictions.length);
}

export function PublicWatchlistsPage({ watchlists }: { watchlists: PublicWatchlistSummary[] }) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-5">
      <section className="rounded-2xl border border-cyan-500/25 bg-slate-900/70 p-4 shadow-[0_8px_40px_rgba(8,47,73,0.45)]">
        <div className="mb-4">
          <h1 className="text-lg font-semibold tracking-tight text-white sm:text-xl">Community Watchlists</h1>
          <p className="mt-1 text-sm text-slate-300">Best-performing public watchlists, with newer watchlists breaking ties.</p>
        </div>

        {watchlists.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {watchlists.map((watchlist) => {
              const hiddenPredictions = hiddenPredictionCount(watchlist);

              return (
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

                  <div className="mt-4 rounded-xl border border-white/10 bg-slate-900/40 p-4">
                    {watchlist.previewPredictions.length > 0 ? (
                      <div>
                        {watchlist.previewPredictions.map((prediction) => (
                          <WatchlistPreviewRow key={prediction.id} prediction={prediction} watchlistId={watchlist.id} />
                        ))}
                        {hiddenPredictions > 0 ? (
                          <div className="mt-3 border-t border-white/10 pt-3">
                            <Link
                              href={`/analysts/${watchlist.owner.id}/watchlists/${watchlist.id}`}
                              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-cyan-300 transition hover:border-cyan-300/40 hover:text-cyan-100"
                              aria-label={`View ${hiddenPredictions} more predictions in ${watchlist.name}`}
                            >
                              <span aria-hidden="true">...</span>
                              <span>{hiddenPredictions} more</span>
                            </Link>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-300">No predictions in this watchlist yet.</p>
                    )}
                  </div>
                </article>
              );
            })}
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
