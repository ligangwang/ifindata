import type { Metadata } from "next";
import { WatchlistDetailPage } from "@/components/watchlist-detail-page";
import { generatePublicWatchlistMetadata } from "@/lib/watchlists/public-page";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return generatePublicWatchlistMetadata(id);
}

export default async function WatchlistDetailRoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <WatchlistDetailPage watchlistId={id} />;
}
