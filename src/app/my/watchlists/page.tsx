import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = {
  title: "My watchlists | YouAnalyst",
  description: "Create and manage your watchlists on YouAnalyst.",
  robots: noIndexRobots(),
};

export default function MyWatchlistsRoutePage() {
  redirect("/watchlists?tab=mine");
}
