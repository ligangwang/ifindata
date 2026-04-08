export type FeaturedCompany = {
  symbol: string;
  name: string;
  sector: string;
  thesis: string;
  relationships: string[];
};

export const featuredCompanies: FeaturedCompany[] = [
  {
    symbol: "MSFT",
    name: "Microsoft",
    sector: "Technology",
    thesis:
      "Cloud infrastructure, enterprise software, and AI distribution make Microsoft a central node for technology cash-flow and ecosystem analysis.",
    relationships: ["cloud partner", "enterprise stack", "AI platform"],
  },
  {
    symbol: "NVDA",
    name: "NVIDIA",
    sector: "Technology",
    thesis:
      "NVIDIA sits at a high-leverage point in the AI compute chain, linking hyperscalers, semiconductor manufacturing, and model deployment demand.",
    relationships: ["chip supply", "AI compute", "hyperscaler demand"],
  },
  {
    symbol: "AMZN",
    name: "Amazon",
    sector: "Consumer",
    thesis:
      "Amazon connects retail demand signals, logistics infrastructure, and cloud economics, which makes it valuable as a multi-cluster bridge node.",
    relationships: ["retail demand", "logistics", "cloud services"],
  },
  {
    symbol: "LLY",
    name: "Eli Lilly",
    sector: "Healthcare",
    thesis:
      "Eli Lilly is a strong healthcare graph node for obesity therapeutics, supply-chain constraints, and competitive therapy category mapping.",
    relationships: ["drug pipeline", "therapy competition", "manufacturing scale"],
  },
];