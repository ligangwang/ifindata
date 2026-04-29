import type { Metadata } from "next";
import { WatchlistDetailPage } from "@/components/watchlist-detail-page";
import { generatePublicWatchlistMetadata } from "@/lib/watchlists/public-page";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; watchlistId: string }>;
  searchParams: Promise<{ share?: string | string[] }>;
}): Promise<Metadata> {
  const { watchlistId } = await params;
  const { share } = await searchParams;
  return generatePublicWatchlistMetadata(watchlistId, { share });
}

export default async function AnalystWatchlistPage({
  params,
}: {
  params: Promise<{ id: string; watchlistId: string }>;
}) {
  const { watchlistId } = await params;
  return <WatchlistDetailPage watchlistId={watchlistId} />;
}
