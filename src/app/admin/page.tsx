import type { Metadata } from "next";
import { AdminDashboardPage } from "@/components/admin-dashboard-page";
import { noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Admin | YouAnalyst",
  description: "Review admin tools for YouAnalyst.",
  robots: noIndexRobots(),
};

export default function AdminPage() {
  return <AdminDashboardPage />;
}
