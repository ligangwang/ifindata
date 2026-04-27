import { createWatchlistShareImage, watchlistShareCardContentType, watchlistShareCardSize } from "@/lib/watchlists/share-card";

export const runtime = "nodejs";
export const alt = "YouAnalyst watchlist share card";
export const size = watchlistShareCardSize;
export const contentType = watchlistShareCardContentType;

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return createWatchlistShareImage(id);
}
