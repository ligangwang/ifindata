import { TickerPage } from "@/components/ticker-page";

export default async function TickerRoutePage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  return <TickerPage ticker={symbol} />;
}
