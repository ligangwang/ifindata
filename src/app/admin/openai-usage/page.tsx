import type { Metadata } from "next";
import { AdminOpenAiUsagePage } from "@/components/admin-openai-usage-page";
import { noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = {
  title: "OpenAI Usage | Admin | YouAnalyst",
  description: "Review OpenAI token usage and estimated costs.",
  robots: noIndexRobots(),
};

export default function AdminOpenAiUsageRoutePage() {
  return <AdminOpenAiUsagePage />;
}
