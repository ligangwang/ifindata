import type { Metadata } from "next";
import { WatchlistDetailPage } from "@/components/watchlist-detail-page";
import { generatePublicWatchlistMetadata } from "@/lib/watchlists/public-page";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; watchlistId: string }>;
}): Promise<Metadata> {
  const { watchlistId } = await params;
  return generatePublicWatchlistMetadata(watchlistId);
}

export default async function AnalystWatchlistPage({
  params,
}: {
  params: Promise<{ id: string; watchlistId: string }>;
}) {
  const { watchlistId } = await params;
  return <WatchlistDetailPage watchlistId={watchlistId} />;
}
