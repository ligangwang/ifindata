import type { Metadata } from "next";
import { PredictionsFeed } from "@/components/predictions-feed";

export const metadata: Metadata = {
  title: "Prediction feed | YouAnalyst",
  description: "Browse the latest public stock predictions and analyst calls from the YouAnalyst community.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Prediction feed | YouAnalyst",
    description: "Browse the latest public stock predictions and analyst calls from the YouAnalyst community.",
    url: "/",
  },
  twitter: {
    title: "Prediction feed | YouAnalyst",
    description: "Browse the latest public stock predictions and analyst calls from the YouAnalyst community.",
  },
};

export default function PredictionsRoutePage() {
  return <PredictionsFeed />;
}
