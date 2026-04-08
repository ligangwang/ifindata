import { Pool } from "pg";
import { seededCompanies, seededRelationships } from "@/lib/graph/seed";
import type {
  Company,
  CompanyResponse,
  GraphEdge,
  GraphNode,
  GraphResponse,
  Relationship,
  RelationshipType,
} from "@/lib/graph/types";

const typeSet = new Set<RelationshipType>(["supplier", "customer", "competitor"]);

let pool: Pool | null = null;

function getPool(): Pool | null {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    });
  }

  return pool;
}

function isRelationshipType(value: string): value is RelationshipType {
  return typeSet.has(value as RelationshipType);
}

function normalizeTypes(types?: string[]): RelationshipType[] {
  const next = (types ?? []).filter(isRelationshipType);
  return next.length > 0 ? next : ["supplier", "customer", "competitor"];
}

function filterSeedRelationships(companyId: number, types: RelationshipType[]): Relationship[] {
  return seededRelationships.filter(
    (relationship) =>
      (relationship.sourceCompanyId === companyId || relationship.targetCompanyId === companyId) &&
      types.includes(relationship.type),
  );
}

function mapEdge(relationship: Relationship): GraphEdge {
  return {
    id: `rel-${relationship.id}`,
    source: String(relationship.sourceCompanyId),
    target: String(relationship.targetCompanyId),
    type: relationship.type,
    confidence: relationship.confidence,
    sourceNote: relationship.source,
  };
}

function mapNode(company: Company): GraphNode {
  return {
    id: String(company.id),
    label: company.name,
    ticker: company.ticker,
    description: company.description,
  };
}

async function findCompanyInDb(idOrSlug: string): Promise<Company | null> {
  const db = getPool();
  if (!db) {
    return null;
  }

  const asNumber = Number(idOrSlug);
  let rows: Array<Record<string, unknown>> = [];

  if (Number.isInteger(asNumber)) {
    const response = await db.query(
      "SELECT id, name, ticker, description, metadata FROM companies WHERE id = $1",
      [asNumber],
    );
    rows = response.rows as Array<Record<string, unknown>>;
  } else {
    const response = await db.query(
      "SELECT id, name, ticker, description, metadata FROM companies WHERE LOWER(name) = LOWER($1) OR LOWER(ticker) = LOWER($1)",
      [idOrSlug],
    );
    rows = response.rows as Array<Record<string, unknown>>;
  }

  if (rows.length === 0) {
    return null;
  }

  const row = rows[0];
  return {
    id: Number(row.id),
    name: String(row.name),
    ticker: String(row.ticker),
    description: String(row.description ?? ""),
    metadata: (row.metadata as Record<string, unknown>) ?? {},
  };
}

function findCompanyInSeed(idOrSlug: string): Company | null {
  const asNumber = Number(idOrSlug);
  if (Number.isInteger(asNumber)) {
    return seededCompanies.find((company) => company.id === asNumber) ?? null;
  }

  const slug = idOrSlug.toLowerCase();
  return (
    seededCompanies.find(
      (company) => company.name.toLowerCase() === slug || company.ticker.toLowerCase() === slug,
    ) ?? null
  );
}

export async function getCompanyByIdOrSlug(idOrSlug: string): Promise<Company | null> {
  const fromDb = await findCompanyInDb(idOrSlug);
  if (fromDb) {
    return fromDb;
  }

  return findCompanyInSeed(idOrSlug);
}

async function getRelationshipsForCompany(
  companyId: number,
  relationshipTypes: RelationshipType[],
): Promise<Relationship[]> {
  const db = getPool();
  if (!db) {
    return filterSeedRelationships(companyId, relationshipTypes);
  }

  const { rows } = await db.query(
    `SELECT id, source_company_id, target_company_id, type, weight, confidence, source, created_at
     FROM relationships
     WHERE (source_company_id = $1 OR target_company_id = $1)
       AND type = ANY($2::relationship_type[])
     ORDER BY confidence DESC`,
    [companyId, relationshipTypes],
  );

  return rows.map((row) => ({
    id: Number(row.id),
    sourceCompanyId: Number(row.source_company_id),
    targetCompanyId: Number(row.target_company_id),
    type: row.type as RelationshipType,
    weight: row.weight == null ? null : Number(row.weight),
    confidence: Number(row.confidence),
    source: String(row.source),
    createdAt: new Date(row.created_at).toISOString(),
  }));
}

async function getCompaniesByIds(companyIds: number[]): Promise<Company[]> {
  const db = getPool();
  if (!db) {
    const companySet = new Set(companyIds);
    return seededCompanies.filter((company) => companySet.has(company.id));
  }

  const { rows } = await db.query(
    "SELECT id, name, ticker, description, metadata FROM companies WHERE id = ANY($1::int[])",
    [companyIds],
  );

  return rows.map((row) => ({
    id: Number(row.id),
    name: String(row.name),
    ticker: String(row.ticker),
    description: String(row.description ?? ""),
    metadata: (row.metadata as Record<string, unknown>) ?? {},
  }));
}

export async function searchCompanies(query: string, limit = 10): Promise<Company[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const db = getPool();
  if (!db) {
    const q = trimmed.toLowerCase();
    return seededCompanies
      .filter((company) => company.name.toLowerCase().includes(q) || company.ticker.toLowerCase().includes(q))
      .slice(0, limit);
  }

  const { rows } = await db.query(
    `SELECT id, name, ticker, description, metadata
     FROM companies
     WHERE LOWER(name) LIKE LOWER($1) OR LOWER(ticker) LIKE LOWER($1)
     ORDER BY name ASC
     LIMIT $2`,
    [`%${trimmed}%`, limit],
  );

  return rows.map((row) => ({
    id: Number(row.id),
    name: String(row.name),
    ticker: String(row.ticker),
    description: String(row.description ?? ""),
    metadata: (row.metadata as Record<string, unknown>) ?? {},
  }));
}

export async function getCompanyWithRelationships(
  idOrSlug: string,
  relationshipTypes?: string[],
): Promise<CompanyResponse | null> {
  const company = await getCompanyByIdOrSlug(idOrSlug);
  if (!company) {
    return null;
  }

  const normalizedTypes = normalizeTypes(relationshipTypes);
  const relationships = await getRelationshipsForCompany(company.id, normalizedTypes);

  return {
    company,
    relationships,
  };
}

export async function getGraph(
  idOrSlug: string,
  relationshipTypes?: string[],
  maxNodes = 50,
): Promise<GraphResponse | null> {
  const company = await getCompanyByIdOrSlug(idOrSlug);
  if (!company) {
    return null;
  }

  const normalizedTypes = normalizeTypes(relationshipTypes);
  const relationships = await getRelationshipsForCompany(company.id, normalizedTypes);
  const slicedRelationships = relationships.slice(0, Math.max(1, maxNodes));

  const nodeIds = new Set<number>([company.id]);
  for (const relationship of slicedRelationships) {
    nodeIds.add(relationship.sourceCompanyId);
    nodeIds.add(relationship.targetCompanyId);
  }

  const companies = await getCompaniesByIds(Array.from(nodeIds));

  return {
    centerCompanyId: company.id,
    relationshipTypes: normalizedTypes,
    nodes: companies.map(mapNode),
    edges: slicedRelationships.map(mapEdge),
  };
}
