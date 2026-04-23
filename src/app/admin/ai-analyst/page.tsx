import type { Metadata } from "next";
import { AdminAiAnalystPage } from "@/components/admin-ai-analyst-page";
import { noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = {
  title: "AI Analyst Drafts | Admin | YouAnalyst",
  description: "Review and publish AI analyst drafts.",
  robots: noIndexRobots(),
};

export default function AdminAiAnalystRoutePage() {
  return <AdminAiAnalystPage />;
}

