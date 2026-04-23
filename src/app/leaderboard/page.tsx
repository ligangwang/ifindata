import type { Metadata } from "next";
import { LeaderboardPage } from "@/components/leaderboard-page";

export const metadata: Metadata = {
  title: "Leaderboard | YouAnalyst",
  description: "See top-performing analysts and compare public stock prediction track records on YouAnalyst.",
  alternates: {
    canonical: "/leaderboard",
  },
};

export default function LeaderboardRoutePage() {
  return <LeaderboardPage />;
}
