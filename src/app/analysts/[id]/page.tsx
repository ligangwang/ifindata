import { AnalystProfilePage } from "@/components/analyst-profile-page";

export default async function AnalystRoutePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ onboarding?: string | string[] }>;
}) {
  const { id } = await params;
  const { onboarding } = await searchParams;
  const onboardingValue = Array.isArray(onboarding) ? onboarding[0] : onboarding;

  return <AnalystProfilePage userId={id} promptForNickname={onboardingValue === "nickname"} />;
}
