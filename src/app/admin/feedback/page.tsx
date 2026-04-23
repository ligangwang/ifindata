import type { Metadata } from "next";
import { AdminFeedbackPage } from "@/components/admin-feedback-page";
import { noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Feedback | Admin | YouAnalyst",
  description: "Review feedback submissions in the admin dashboard.",
  robots: noIndexRobots(),
};

export default function AdminFeedbackRoutePage() {
  return <AdminFeedbackPage />;
}
