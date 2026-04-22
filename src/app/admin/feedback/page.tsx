import type { Metadata } from "next";
import { AdminFeedbackPage } from "@/components/admin-feedback-page";

export const metadata: Metadata = {
  title: "Feedback | Admin | YouAnalyst",
  description: "Review feedback submissions in the admin dashboard.",
};

export default function AdminFeedbackRoutePage() {
  return <AdminFeedbackPage />;
}
