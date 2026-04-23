import type { Metadata } from "next";
import { CreatePredictionPage } from "@/components/create-prediction-page";
import { noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = {
  title: "New prediction | YouAnalyst",
  description: "Create a new public stock prediction on YouAnalyst.",
  robots: noIndexRobots(),
};

export default async function NewPredictionRoutePage({
  searchParams,
}: {
  searchParams: Promise<{ watchlistId?: string | string[] }>;
}) {
  const { watchlistId } = await searchParams;
  const requestedWatchlistId = Array.isArray(watchlistId) ? watchlistId[0] : watchlistId;

  return <CreatePredictionPage requestedWatchlistId={requestedWatchlistId ?? ""} />;
}
