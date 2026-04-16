import { PredictionDetailPage } from "@/components/prediction-detail-page";

export default async function PredictionDetailRoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PredictionDetailPage predictionId={id} />;
}
