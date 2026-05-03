import type { Metadata } from "next";
import Link from "next/link";
import { CompanySearchCard } from "@/components/company-search-card";
import { listLatestCompanyGraphRuns } from "@/lib/company-graph/latest-runs";
import { featuredCompanies } from "@/lib/featured-companies";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Company graph | YouAnalyst",
  description: "Search a ticker to open or request a company relationship graph on YouAnalyst.",
  alternates: {
    canonical: "/companies",
  },
  openGraph: {
    title: "Company graph | YouAnalyst",
    description: "Search a ticker to open or request a company relationship graph on YouAnalyst.",
    url: "/companies",
  },
  twitter: {
    title: "Company graph | YouAnalyst",
    description: "Search a ticker to open or request a company relationship graph on YouAnalyst.",
  },
};

export default async function CompaniesPage() {
  const latestGraphRuns = await listLatestCompanyGraphRuns(4);
  const graphCompanies = latestGraphRuns.length > 0 ? latestGraphRuns : featuredCompanies;

  return (
    <main className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl flex-col px-4 pt-24 pb-8 sm:pt-28 lg:pt-32">
      <section className="w-full">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="sr-only">Company graph search</h1>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">Company graph</p>
        </div>

        <CompanySearchCard />

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {graphCompanies.map((company) => (
            <Link
              key={company.symbol}
              href={`/ticker/${company.symbol}`}
              className="rounded-full border border-white/10 bg-slate-950/50 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-300/60 hover:bg-cyan-500/10"
            >
              ${company.symbol}
              <span className="ml-2 font-normal text-slate-400">{company.name}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
