import { createPredictionShareImage, predictionShareCardContentType, predictionShareCardSize } from "@/lib/predictions/share-card";

export const runtime = "nodejs";
export const alt = "YouAnalyst prediction share card";
export const size = predictionShareCardSize;
export const contentType = predictionShareCardContentType;

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return createPredictionShareImage(id);
}
