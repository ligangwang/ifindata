import type { Metadata } from "next";
import { AdminDashboardPage } from "@/components/admin-dashboard-page";

export const metadata: Metadata = {
  title: "Admin | YouAnalyst",
  description: "Review admin tools for YouAnalyst.",
};

export default function AdminPage() {
  return <AdminDashboardPage />;
}
