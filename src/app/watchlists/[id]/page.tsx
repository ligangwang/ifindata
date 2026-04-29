import type { Metadata } from "next";
import { WatchlistDetailPage } from "@/components/watchlist-detail-page";
import { generatePublicWatchlistMetadata } from "@/lib/watchlists/public-page";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ share?: string | string[] }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { share } = await searchParams;
  return generatePublicWatchlistMetadata(id, { share });
}

export default async function WatchlistDetailRoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <WatchlistDetailPage watchlistId={id} />;
}
