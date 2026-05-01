import type { Metadata } from "next";
import CompaniesPage from "@/app/companies/page";

export const metadata: Metadata = {
  title: "Company graph | YouAnalyst",
  description: "Explore company relationship graphs, public calls, watchlists, and market themes on YouAnalyst.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Company graph | YouAnalyst",
    description: "Explore company relationship graphs, public calls, watchlists, and market themes on YouAnalyst.",
    url: "/",
  },
  twitter: {
    title: "Company graph | YouAnalyst",
    description: "Explore company relationship graphs, public calls, watchlists, and market themes on YouAnalyst.",
  },
};

export default function Home() {
  return <CompaniesPage />;
}
