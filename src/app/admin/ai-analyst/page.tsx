import type { Metadata } from "next";
import { AdminAiAnalystPage } from "@/components/admin-ai-analyst-page";

export const metadata: Metadata = {
  title: "AI Analyst Drafts | Admin | YouAnalyst",
  description: "Review and publish AI analyst drafts.",
};

export default function AdminAiAnalystRoutePage() {
  return <AdminAiAnalystPage />;
}

