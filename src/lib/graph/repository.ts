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

export function getCompanyByIdOrSlug(idOrSlug: string): Company | null {
  return findCompanyInSeed(idOrSlug);
}

function getRelationshipsForCompany(
  companyId: number,
  relationshipTypes: RelationshipType[],
): Relationship[] {
  return filterSeedRelationships(companyId, relationshipTypes);
}

function getCompaniesByIds(companyIds: number[]): Company[] {
  const companySet = new Set(companyIds);
  return seededCompanies.filter((company) => companySet.has(company.id));
}

export function searchCompanies(query: string, limit = 10): Company[] {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const q = trimmed.toLowerCase();
  return seededCompanies
    .filter((c) => c.name.toLowerCase().includes(q) || c.ticker.toLowerCase().includes(q))
    .slice(0, limit);
}

export function getCompanyWithRelationships(
  idOrSlug: string,
  relationshipTypes?: string[],
): CompanyResponse | null {
  const company = getCompanyByIdOrSlug(idOrSlug);
  if (!company) return null;

  const normalizedTypes = normalizeTypes(relationshipTypes);
  const relationships = getRelationshipsForCompany(company.id, normalizedTypes);
  return { company, relationships };
}

export function getGraph(
  idOrSlug: string,
  relationshipTypes?: string[],
  maxNodes = 50,
): GraphResponse | null {
  const company = getCompanyByIdOrSlug(idOrSlug);
  if (!company) return null;

  const normalizedTypes = normalizeTypes(relationshipTypes);
  const relationships = getRelationshipsForCompany(company.id, normalizedTypes);
  const slicedRelationships = relationships.slice(0, Math.max(1, maxNodes));

  const nodeIds = new Set<number>([company.id]);
  for (const rel of slicedRelationships) {
    nodeIds.add(rel.sourceCompanyId);
    nodeIds.add(rel.targetCompanyId);
  }

  return {
    centerCompanyId: company.id,
    relationshipTypes: normalizedTypes,
    nodes: getCompaniesByIds(Array.from(nodeIds)).map(mapNode),
    edges: slicedRelationships.map(mapEdge),
  };
}
