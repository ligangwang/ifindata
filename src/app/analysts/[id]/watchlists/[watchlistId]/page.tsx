import { WatchlistDetailPage } from "@/components/watchlist-detail-page";

export default async function AnalystWatchlistPage({
  params,
}: {
  params: Promise<{ id: string; watchlistId: string }>;
}) {
  const { id, watchlistId } = await params;
  return <WatchlistDetailPage analystUserId={id} watchlistId={watchlistId} />;
}
