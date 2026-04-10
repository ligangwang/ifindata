import { getAdminFirestore } from "@/lib/firebase/admin";
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

type CompanyDoc = {
  id: number;
  name: string;
  nameLower?: string;
  ticker: string;
  tickerLower?: string;
  description?: string;
  metadata?: Record<string, unknown>;
};

type RelationshipDoc = {
  id: number;
  sourceCompanyId: number;
  targetCompanyId: number;
  type: RelationshipType;
  weight?: number | null;
  confidence: number;
  source?: string;
  createdAt?: string;
};

function mapCompanyDoc(doc: CompanyDoc): Company {
  return {
    id: Number(doc.id),
    name: doc.name,
    ticker: doc.ticker,
    description: doc.description ?? "",
    metadata: doc.metadata ?? {},
  };
}

function mapRelationshipDoc(doc: RelationshipDoc): Relationship {
  return {
    id: Number(doc.id),
    sourceCompanyId: Number(doc.sourceCompanyId),
    targetCompanyId: Number(doc.targetCompanyId),
    type: doc.type,
    weight: doc.weight == null ? null : Number(doc.weight),
    confidence: Number(doc.confidence),
    source: doc.source ?? "firestore",
    createdAt: doc.createdAt ?? new Date().toISOString(),
  };
}

function isRelationshipType(value: string): value is RelationshipType {
  return typeSet.has(value as RelationshipType);
}

function normalizeTypes(types?: string[]): RelationshipType[] {
  const next = (types ?? []).filter(isRelationshipType);
  return next.length > 0 ? next : ["supplier", "customer", "competitor"];
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

async function findCompanyInFirestore(idOrSlug: string): Promise<Company | null> {
  const db = getAdminFirestore();
  const asNumber = Number(idOrSlug);

  if (Number.isInteger(asNumber)) {
    const snap = await db.collection("companies").doc(String(asNumber)).get();
    if (snap.exists) {
      return mapCompanyDoc(snap.data() as CompanyDoc);
    }
    return null;
  }

  const slug = idOrSlug.toLowerCase();
  const byTicker = await db
    .collection("companies")
    .where("tickerLower", "==", slug)
    .limit(1)
    .get();
  if (!byTicker.empty) {
    return mapCompanyDoc(byTicker.docs[0].data() as CompanyDoc);
  }

  const byName = await db
    .collection("companies")
    .where("nameLower", "==", slug)
    .limit(1)
    .get();
  if (!byName.empty) {
    return mapCompanyDoc(byName.docs[0].data() as CompanyDoc);
  }

  return null;
}

export async function getCompanyByIdOrSlug(idOrSlug: string): Promise<Company | null> {
  return findCompanyInFirestore(idOrSlug);
}

async function getRelationshipsForCompany(
  companyId: number,
  relationshipTypes: RelationshipType[],
): Promise<Relationship[]> {
  const db = getAdminFirestore();
  const [fromSource, fromTarget] = await Promise.all([
    db
      .collection("relationships")
      .where("sourceCompanyId", "==", companyId)
      .where("type", "in", relationshipTypes)
      .orderBy("confidence", "desc")
      .get(),
    db
      .collection("relationships")
      .where("targetCompanyId", "==", companyId)
      .where("type", "in", relationshipTypes)
      .orderBy("confidence", "desc")
      .get(),
  ]);

  const dedup = new Map<string, Relationship>();
  for (const snap of [...fromSource.docs, ...fromTarget.docs]) {
    const relationship = mapRelationshipDoc(snap.data() as RelationshipDoc);
    dedup.set(String(relationship.id), relationship);
  }

  return Array.from(dedup.values()).sort((a, b) => b.confidence - a.confidence);
}

async function getCompaniesByIds(companyIds: number[]): Promise<Company[]> {
  if (companyIds.length === 0) {
    return [];
  }

  const db = getAdminFirestore();
  const docs = await Promise.all(
    companyIds.map((id) => db.collection("companies").doc(String(id)).get()),
  );
  return docs.filter((doc) => doc.exists).map((doc) => mapCompanyDoc(doc.data() as CompanyDoc));
}

async function searchCompaniesInFirestore(query: string, limit: number): Promise<Company[]> {
  const db = getAdminFirestore();
  const q = query.toLowerCase();
  const end = `${q}\uf8ff`;

  const [nameMatches, tickerMatches] = await Promise.all([
    db
      .collection("companies")
      .where("nameLower", ">=", q)
      .where("nameLower", "<=", end)
      .orderBy("nameLower")
      .limit(limit)
      .get(),
    db
      .collection("companies")
      .where("tickerLower", ">=", q)
      .where("tickerLower", "<=", end)
      .orderBy("tickerLower")
      .limit(limit)
      .get(),
  ]);

  const dedup = new Map<number, Company>();
  for (const snap of [...nameMatches.docs, ...tickerMatches.docs]) {
    const company = mapCompanyDoc(snap.data() as CompanyDoc);
    dedup.set(company.id, company);
  }

  return Array.from(dedup.values()).slice(0, limit);
}

export async function searchCompanies(query: string, limit = 10): Promise<Company[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  return searchCompaniesInFirestore(trimmed, limit);
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

  return { company, relationships };
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
  for (const rel of slicedRelationships) {
    nodeIds.add(rel.sourceCompanyId);
    nodeIds.add(rel.targetCompanyId);
  }

  const companies = await getCompaniesByIds(Array.from(nodeIds));

  return {
    centerCompanyId: company.id,
    relationshipTypes: normalizedTypes,
    nodes: companies.map(mapNode),
    edges: slicedRelationships.map(mapEdge),
  };
}
