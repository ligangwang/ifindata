import type { Metadata } from "next";
import { MyWatchlistsPage } from "@/components/my-watchlists-page";
import { noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = {
  title: "My watchlists | YouAnalyst",
  description: "Create and manage your watchlists on YouAnalyst.",
  robots: noIndexRobots(),
};

export default function MyWatchlistsRoutePage() {
  return <MyWatchlistsPage />;
}
