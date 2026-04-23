import type { Metadata } from "next";
import { PredictionsFeed } from "@/components/predictions-feed";

export const metadata: Metadata = {
  title: "Top predictions | YouAnalyst",
  description: "Browse top-performing public stock predictions and analyst calls from the YouAnalyst community.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Top predictions | YouAnalyst",
    description: "Browse top-performing public stock predictions and analyst calls from the YouAnalyst community.",
    url: "/",
  },
  twitter: {
    title: "Top predictions | YouAnalyst",
    description: "Browse top-performing public stock predictions and analyst calls from the YouAnalyst community.",
  },
};

export default function PredictionsRoutePage() {
  return <PredictionsFeed />;
}
