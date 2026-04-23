import type { Metadata } from "next";
import { FollowListPage } from "@/components/follow-list-page";
import { noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Following | YouAnalyst",
  robots: noIndexRobots(),
};

export default async function AnalystFollowingRoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <FollowListPage userId={id} kind="following" />;
}
