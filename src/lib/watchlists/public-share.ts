const WATCHLIST_SHARE_CARD_VERSION = "v1";

export function watchlistCanonicalPath(watchlistId: string): string {
  return `/watchlists/${encodeURIComponent(watchlistId)}`;
}

export function watchlistShareVersion(watchlistId: string, watchlist: Record<string, unknown>): string {
  const updatedAt = typeof watchlist.updatedAt === "string" ? watchlist.updatedAt.trim() : "";
  const createdAt = typeof watchlist.createdAt === "string" ? watchlist.createdAt.trim() : "";
  const versionSource = updatedAt || createdAt || watchlistId;
  const compactVersion = versionSource.replace(/[^0-9A-Za-z]/g, "");
  return `${WATCHLIST_SHARE_CARD_VERSION}-${compactVersion || watchlistId}`;
}
