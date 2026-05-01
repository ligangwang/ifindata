import type { Metadata } from "next";
import { AdminCompanyGraphRequestsPage } from "@/components/admin-company-graph-requests-page";
import { noIndexRobots } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Company Graph Requests | Admin | YouAnalyst",
  description: "Generate queued company graph requests.",
  robots: noIndexRobots(),
};

export default function AdminCompanyGraphRoutePage() {
  return <AdminCompanyGraphRequestsPage />;
}
