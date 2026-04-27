import type { Metadata } from "next";
import { AuthPage } from "@/components/auth-page";
import { noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Sign in | YouAnalyst",
  description: "Sign in to create watchlists, publish stock calls, and build your public track record.",
  robots: noIndexRobots(),
};

export default function AuthRoutePage() {
  return <AuthPage />;
}
