import type { Metadata } from "next";
import { FollowListPage } from "@/components/follow-list-page";
import { noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Followers | YouAnalyst",
  robots: noIndexRobots(),
};

export default async function AnalystFollowersRoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <FollowListPage userId={id} kind="followers" />;
}
