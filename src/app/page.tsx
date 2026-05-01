import type { Metadata } from "next";
import CompaniesPage from "@/app/companies/page";

export const metadata: Metadata = {
  title: "Company graph | YouAnalyst",
  description: "Search a ticker to open or request a company relationship graph on YouAnalyst.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Company graph | YouAnalyst",
    description: "Search a ticker to open or request a company relationship graph on YouAnalyst.",
    url: "/",
  },
  twitter: {
    title: "Company graph | YouAnalyst",
    description: "Search a ticker to open or request a company relationship graph on YouAnalyst.",
  },
};

export default function Home() {
  return <CompaniesPage />;
}
