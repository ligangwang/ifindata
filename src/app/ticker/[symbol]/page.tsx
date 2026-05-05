import type { Metadata } from "next";
import { TickerPage } from "@/components/ticker-page";
import { normalizeTicker } from "@/lib/predictions/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ symbol: string }>;
}): Promise<Metadata> {
  const { symbol } = await params;
  const ticker = normalizeTicker(symbol);
  const title = `${ticker} institutional holdings | YouAnalyst`;
  const description = `Explore ${ticker} public calls, watchlists, and institutional 13F holding changes on YouAnalyst.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/ticker/${ticker}`,
    },
    openGraph: {
      title,
      description,
      url: `/ticker/${ticker}`,
    },
    twitter: {
      title,
      description,
    },
  };
}

export default async function TickerRoutePage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  return <TickerPage ticker={symbol} />;
}
