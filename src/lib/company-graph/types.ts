export const COMPANY_GRAPH_EXTRACTION_VERSION = "supply-chain-ontology-v1";

export const COMPANY_GRAPH_RELATIONSHIP_TYPES = [
  "SUPPLIER_OF",
  "CUSTOMER_OF",
  "COMPETES_WITH",
  "PARTNER_OF",
  "DISTRIBUTES_FOR",
  "MANUFACTURES_FOR",
] as const;

export const COMPANY_GRAPH_TARGET_TYPES = [
  "company",
] as const;

export const COMPANY_GRAPH_EDGE_DIRECTIONS = [
  "source_to_target",
  "target_to_source",
  "bidirectional",
] as const;

export type CompanyGraphRelationshipType = (typeof COMPANY_GRAPH_RELATIONSHIP_TYPES)[number];
export type CompanyGraphTargetType = (typeof COMPANY_GRAPH_TARGET_TYPES)[number];
export type CompanyGraphEdgeDirection = (typeof COMPANY_GRAPH_EDGE_DIRECTIONS)[number];

export type CompanyGraphEdge = {
  id: string;
  sourceName: string;
  sourceTicker: string;
  sourceCik: string;
  targetName: string;
  targetType: CompanyGraphTargetType;
  relationshipType: CompanyGraphRelationshipType;
  direction: CompanyGraphEdgeDirection;
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
