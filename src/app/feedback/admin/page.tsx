import type { Metadata } from "next";
import { AdminFeedbackPage } from "@/components/mvp/admin-feedback-page";

export const metadata: Metadata = {
  title: "Feedback Admin | Younalyst",
  description: "Review submitted feedback for Younalyst.",
};

export default function Page() {
  return <AdminFeedbackPage />;
}
