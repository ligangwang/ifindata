import type { Metadata } from "next";
import { PredictionsFeed } from "@/components/predictions-feed";

export const metadata: Metadata = {
  title: "Build your track record in public | YouAnalyst",
  description: "Create watchlists, publish stock calls, and let performance speak for itself on YouAnalyst.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Build your track record in public | YouAnalyst",
    description: "Create watchlists, publish stock calls, and let performance speak for itself on YouAnalyst.",
    url: "/",
  },
  twitter: {
    title: "Build your track record in public | YouAnalyst",
    description: "Create watchlists, publish stock calls, and let performance speak for itself on YouAnalyst.",
  },
};

export default function Home() {
  return <PredictionsFeed />;
}
