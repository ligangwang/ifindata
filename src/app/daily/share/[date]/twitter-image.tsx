import { createDailyShareImage, dailyShareCardContentType, dailyShareCardSize } from "@/lib/daily-scores/share-card";

export const runtime = "nodejs";
export const alt = "YouAnalyst daily best calls share card";
export const size = dailyShareCardSize;
export const contentType = dailyShareCardContentType;

export default async function Image({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  return createDailyShareImage(date === "latest" ? null : date);
}
