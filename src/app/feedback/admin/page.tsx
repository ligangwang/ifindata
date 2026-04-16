import type { Metadata } from "next";
import { AdminFeedbackPage } from "@/components/admin-feedback-page";

export const metadata: Metadata = {
  title: "Feedback Admin | YouAnalyst",
  description: "Review submitted feedback for YouAnalyst.",
};

export default function Page() {
  return <AdminFeedbackPage />;
}
