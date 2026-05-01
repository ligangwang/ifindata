import type { Metadata } from "next";
import Link from "next/link";
import { CompanySearchCard } from "@/components/company-search-card";
import { featuredCompanies } from "@/lib/featured-companies";

export const metadata: Metadata = {
  title: "Company graph | YouAnalyst",
  description: "Explore company relationship graphs, public calls, watchlists, and market themes on YouAnalyst.",
  alternates: {
    canonical: "/companies",
  },
  openGraph: {
    title: "Company graph | YouAnalyst",
    description: "Explore company relationship graphs, public calls, watchlists, and market themes on YouAnalyst.",
    url: "/companies",
  },
  twitter: {
    title: "Company graph | YouAnalyst",
    description: "Explore company relationship graphs, public calls, watchlists, and market themes on YouAnalyst.",
  },
};

export default function CompaniesPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <section className="rounded-2xl border border-cyan-500/25 bg-slate-900/70 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">Company graph</p>
        <h1 className="mt-2 font-[var(--font-sora)] text-4xl font-semibold text-cyan-100">Explore companies by relationships</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
          Start from a ticker, then map related market themes, public calls, watchlists, and company context.
        </p>
      </section>

      <CompanySearchCard />

      <section className="mt-4 grid gap-3 md:grid-cols-2">
        {featuredCompanies.map((company) => (
          <Link
            key={company.symbol}
            href={`/ticker/${company.symbol}`}
            className="rounded-2xl border border-white/10 bg-slate-950/55 p-5 transition hover:border-cyan-300/60 hover:bg-cyan-500/5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{company.sector}</p>
                <h2 className="mt-1 font-[var(--font-sora)] text-2xl font-semibold text-cyan-100">
                  ${company.symbol}
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-100">{company.name}</p>
              </div>
              <span className="rounded-full border border-cyan-400/35 px-3 py-1 text-xs font-semibold text-cyan-100">
                View graph
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-300">{company.thesis}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {company.relationships.map((relationship) => (
                <span
                  key={relationship}
                  className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300"
                >
                  {relationship}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
