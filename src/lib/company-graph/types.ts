export const COMPANY_GRAPH_EXTRACTION_VERSION = "supply-chain-competitors-v1";

export const COMPANY_GRAPH_RELATIONSHIP_TYPES = [
  "vendor",
  "supplier",
  "customer",
  "competitor",
  "partner",
] as const;

export const COMPANY_GRAPH_TARGET_TYPES = [
  "company",
] as const;

export type CompanyGraphRelationshipType = (typeof COMPANY_GRAPH_RELATIONSHIP_TYPES)[number];
export type CompanyGraphTargetType = (typeof COMPANY_GRAPH_TARGET_TYPES)[number];

export type CompanyGraphEdge = {
  id: string;
  sourceName: string;
  sourceTicker: string;
  sourceCik: string;
  targetName: string;
  targetType: CompanyGraphTargetType;
  relationshipType: CompanyGraphRelationshipType;
  evidenceText: string;
  filingType: "10-K";
  accessionNumber: string;
  filingDate: string;
  reportDate: string | null;
  section: "item1" | "item1a" | "unknown";
  confidence: number;
  extractionProvider: "openai";
  extractionModel: string;
  extractionRunId: string;
  createdAt: string;
};

export type CompanyGraphExtractionResult = {
  runId: string;
  extractionVersion: typeof COMPANY_GRAPH_EXTRACTION_VERSION;
  ticker: string;
  companyName: string;
  cik: string;
  dryRun: boolean;
  cached: boolean;
  filing: {
    accessionNumber: string;
    filingDate: string;
    reportDate: string | null;
    primaryDocument: string;
    filingUrl: string;
  };
  sections: Array<{
    id: "item1" | "item1a";
    title: string;
    available: boolean;
    charCount: number;
    storedCharCount: number;
    truncated: boolean;
  }>;
  extraction: {
    provider: "openai";
    model: string;
    responseId: string | null;
    usage: Record<string, unknown> | null;
  } | null;
  edges: CompanyGraphEdge[];
};
