import type { Metadata } from "next";
import { DailyScoresPage } from "@/components/daily-scores-page";

export const metadata: Metadata = {
  title: "Daily score moves | YouAnalyst",
  description: "Track daily score changes and recent analyst performance moves on YouAnalyst.",
  alternates: {
    canonical: "/daily",
  },
};

export default function DailyRoutePage() {
  return <DailyScoresPage />;
}
