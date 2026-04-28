import type { Metadata } from "next";
import { dailyCanonicalPath, dailyShareImageDate, dailyShareVersion } from "@/lib/daily-scores/public-share";
import { getDailyScores } from "@/lib/daily-scores/service";

export async function dailyScoresMetadata(date: string | null): Promise<Metadata> {
  const result = await getDailyScores(date);
  const title = result.date ? `Best Calls Today - ${result.date} | YouAnalyst` : "Daily score moves | YouAnalyst";
  const description = result.callOfTheDay
    ? "See today's top public stock calls and daily performance moves on YouAnalyst."
    : "Track daily score changes and recent analyst performance moves on YouAnalyst.";
  const canonical = dailyCanonicalPath(result.date);
  const imageDate = dailyShareImageDate(result.date);
  const version = dailyShareVersion(result.date);
  const openGraphImage = `/daily/share/${imageDate}/opengraph-image?v=${version}`;
  const twitterImage = `/daily/share/${imageDate}/twitter-image?v=${version}`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      images: [
        {
          url: openGraphImage,
          width: 1200,
          height: 630,
          alt: "YouAnalyst daily top call share card",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [twitterImage],
    },
  };
}
