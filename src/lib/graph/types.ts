export type RelationshipType = "supplier" | "customer" | "competitor";

export type Company = {
  id: number;
  name: string;
  ticker: string;
  description: string;
  metadata: Record<string, unknown>;
};

export type Relationship = {
  id: number;
  sourceCompanyId: number;
  targetCompanyId: number;
  type: RelationshipType;
  weight: number | null;
  confidence: number;
  source: string;
  createdAt: string;
};

export type GraphNode = {
  id: string;
  label: string;
  ticker: string;
  description: string;
};

export type GraphEdge = {
  id: string;
  source: string;
  target: string;
  type: RelationshipType;
  confidence: number;
  sourceNote: string;
};

export type GraphResponse = {
  centerCompanyId: number;
  relationshipTypes: RelationshipType[];
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export type CompanyResponse = {
  company: Company;
  relationships: Relationship[];
};
