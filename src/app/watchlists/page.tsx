import type { Metadata } from "next";
import { PublicWatchlistsPage } from "@/components/public-watchlists-page";
import { listPublicWatchlists } from "@/lib/watchlists/service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Community watchlists | YouAnalyst",
  description: "Browse top-performing public watchlists from the YouAnalyst community.",
  alternates: {
    canonical: "/watchlists",
  },
  openGraph: {
    title: "Community watchlists | YouAnalyst",
    description: "Browse top-performing public watchlists from the YouAnalyst community.",
    url: "/watchlists",
  },
  twitter: {
    title: "Community watchlists | YouAnalyst",
    description: "Browse top-performing public watchlists from the YouAnalyst community.",
  },
};

export default async function WatchlistsRoutePage() {
  const watchlists = await listPublicWatchlists();
  return <PublicWatchlistsPage watchlists={watchlists} />;
}
