import { FollowListPage } from "@/components/follow-list-page";

export default async function AnalystFollowingRoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <FollowListPage userId={id} kind="following" />;
}
