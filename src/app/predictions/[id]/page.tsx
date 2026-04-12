import { PredictionDetailPage } from "@/components/mvp/prediction-detail-page";

export default async function PredictionDetailRoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PredictionDetailPage predictionId={id} />;
}
