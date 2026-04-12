import { AnalystProfilePage } from "@/components/mvp/analyst-profile-page";

export default async function AnalystRoutePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AnalystProfilePage userId={id} />;
}
