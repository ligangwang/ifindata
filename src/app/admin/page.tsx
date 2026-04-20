import type { Metadata } from "next";
import { AdminFeedbackPage } from "@/components/admin-feedback-page";

export const metadata: Metadata = {
  title: "Admin | YouAnalyst",
  description: "Review admin tools for YouAnalyst.",
};

export default function AdminPage() {
  return <AdminFeedbackPage />;
}
