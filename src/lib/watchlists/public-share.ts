const WATCHLIST_SHARE_CARD_VERSION = "v1";

export function watchlistCanonicalPath(watchlistId: string): string {
  return `/watchlists/${encodeURIComponent(watchlistId)}`;
}

function compactVersionSource(value: string): string {
  return value.replace(/[^0-9A-Za-z]/g, "");
}

function metricVersionToken(value: unknown): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  const prefix = value < 0 ? "n" : "p";
  return `${prefix}${Math.abs(value).toFixed(6).replace(/[^0-9]/g, "")}`;
}

export function watchlistShareVersion(watchlistId: string, watchlist: Record<string, unknown>): string {
  const updatedAt = typeof watchlist.updatedAt === "string" ? watchlist.updatedAt.trim() : "";
  const createdAt = typeof watchlist.createdAt === "string" ? watchlist.createdAt.trim() : "";
  const metrics = watchlist.metrics && typeof watchlist.metrics === "object"
    ? watchlist.metrics as Record<string, unknown>
    : null;
  const metricSource = metrics
    ? [
        metricVersionToken(metrics.liveReturn),
        metricVersionToken(metrics.settledReturn),
        metricVersionToken(metrics.totalReturn),
        metricVersionToken(metrics.totalPredictionCount),
        metricVersionToken(metrics.livePredictionCount),
        metricVersionToken(metrics.settledPredictionCount),
        metricVersionToken(metrics.winRate),
      ].filter((part): part is string => Boolean(part)).join("-")
    : "";
  const versionSource = [updatedAt, createdAt, metricSource, watchlistId].filter(Boolean).join("-");
  const compactVersion = compactVersionSource(versionSource);
  return `${WATCHLIST_SHARE_CARD_VERSION}-${compactVersion || watchlistId}`;
}
