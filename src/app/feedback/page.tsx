import type { Metadata } from "next";
import { FeedbackPage } from "@/components/feedback-page";

export const metadata: Metadata = {
  title: "Feedback | YouAnalyst",
  description: "Share feature requests, bug reports, and suggestions for YouAnalyst.",
  alternates: {
    canonical: "/feedback",
  },
};

export default function Page() {
  return <FeedbackPage />;
}
