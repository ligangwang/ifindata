import type { Metadata } from "next";
import { LeaderboardPage } from "@/components/leaderboard-page";

export const metadata: Metadata = {
  title: "Leaderboard | YouAnalyst",
  description: "Compare public analyst track records and top-performing stock calls on YouAnalyst.",
  alternates: {
    canonical: "/leaderboard",
  },
};

export default function LeaderboardRoutePage() {
  return <LeaderboardPage />;
}
