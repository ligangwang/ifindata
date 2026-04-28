import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DailyScoresPage } from "@/components/daily-scores-page";
import { dailyScoresMetadata } from "@/lib/daily-scores/page-metadata";
import { isDailyScoreDate } from "@/lib/daily-scores/service";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ date: string }>;
}): Promise<Metadata> {
  const { date } = await params;
  return dailyScoresMetadata(isDailyScoreDate(date) ? date : null);
}

export default async function DailyDateRoutePage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  if (!isDailyScoreDate(date)) {
    notFound();
  }

  return <DailyScoresPage initialDate={date} />;
}
