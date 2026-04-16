import type { Metadata } from "next";
import { FeedbackPage } from "@/components/feedback-page";

export const metadata: Metadata = {
  title: "Feedback | Younalyst",
  description: "Share feature requests, bug reports, and suggestions for Younalyst.",
};

export default function Page() {
  return <FeedbackPage />;
}
