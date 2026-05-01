import { createHash } from "node:crypto";
import { getAdminFirestore } from "@/lib/firebase/admin";
import {
  buildCompanyGraphExtractionText,
  fetchLatest10K,
  fetchLatest10KSections,
  resolveSecCompanyByTicker,
  summarizeStoredSections,
} from "@/lib/company-graph/sec";
import { extractCompanyGraphRelationships } from "@/lib/company-graph/openai";
import {
  canonicalCompanyName,
  collapseCompanyGraphEdges,
  resolveCompanyGraphTargetNames,
} from "@/lib/company-graph/entities";
import {
  COMPANY_GRAPH_EXTRACTION_VERSION,
  type CompanyGraphEdge,
  type CompanyGraphExtractionResult,
} from "@/lib/company-graph/types";
import { safeRecordOpenAiUsageEvent } from "@/lib/openai/usage";

export type CompanyGraphExtractionInput = {
  ticker: string;
  dryRun?: boolean;
  force?: boolean;
};

const MIN_EDGE_CONFIDENCE = 0.45;
const EDGE_BATCH_SIZE = 450;

function normalizeTicker(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z0-9.-]/g, "");
}

function edgeId(input: {
  accessionNumber: string;
  sourceTicker: string;
  relationshipType: string;
  targetName: string;
  evidenceText: string;
}): string {
  const hash = createHash("sha256")
    .update([
      input.accessionNumber,
      input.sourceTicker,
      input.relationshipType,
      input.targetName.toLowerCase(),
      input.evidenceText.toLowerCase(),
    ].join("|"))
    .digest("hex")
    .slice(0, 24);
  return `${input.sourceTicker}_${input.accessionNumber.replace(/-/g, "")}_${hash}`;
}

function runDocId(ticker: string): string {
  return `${ticker}_latest_10k`;
}

function readCachedResult(data: Record<string, unknown> | undefined): CompanyGraphExtractionResult | null {
  const result = data?.result;
  if (!result || typeof result !== "object") {
    return null;
  }

  return result as CompanyGraphExtractionResult;
}

function isCachedResultForFiling(
  result: CompanyGraphExtractionResult | null,
  accessionNumber: string,
): result is CompanyGraphExtractionResult {
  return result?.filing.accessionNumber === accessionNumber &&
    result.extractionVersion === COMPANY_GRAPH_EXTRACTION_VERSION;
}

async function persistEdges(db: FirebaseFirestore.Firestore, edges: CompanyGraphEdge[]): Promise<number> {
  let written = 0;

  for (let index = 0; index < edges.length; index += EDGE_BATCH_SIZE) {
    const batch = db.batch();
    const chunk = edges.slice(index, index + EDGE_BATCH_SIZE);

    for (const edge of chunk) {
      batch.set(db.collection("company_graph_edges").doc(edge.id), edge, { merge: true });
    }

    await batch.commit();
    written += chunk.length;
  }

  return written;
}

export async function runLatest10KCompanyGraphExtraction(
  input: CompanyGraphExtractionInput,
): Promise<CompanyGraphExtractionResult> {
  const ticker = normalizeTicker(input.ticker);
  if (!ticker) {
    throw new Error("Ticker is required.");
  }

  const dryRun = input.dryRun !== false;
  const force = input.force === true;
  const db = getAdminFirestore();
  const runRef = db.collection("company_graph_runs").doc(runDocId(ticker));
  const company = await resolveSecCompanyByTicker(ticker);
  const filing = await fetchLatest10K(company.cik);

  if (!force) {
    const runSnapshot = await runRef.get();
    const cachedResult = readCachedResult(runSnapshot.data());
    if (isCachedResultForFiling(cachedResult, filing.accessionNumber)) {
      return {
        ...cachedResult,
        dryRun,
        cached: true,
      };
    }
  }

  const existingFilingSnapshot = await db.collection("sec_filings").doc(filing.accessionNumber).get();
  const existingFilingData = existingFilingSnapshot.data() as Record<string, unknown> | undefined;

  if (!force) {
    const existingResult = readCachedResult(existingFilingData?.companyGraphLatestResult as Record<string, unknown> | undefined);
    if (isCachedResultForFiling(existingResult, filing.accessionNumber)) {
      return {
        ...existingResult,
        dryRun,
        cached: true,
      };
    }
  }

  const sections = await fetchLatest10KSections(company.cik, filing);
  const storedSections = summarizeStoredSections(sections);
  const extractionText = buildCompanyGraphExtractionText(sections);

  if (!extractionText) {
    throw new Error(`No extractable latest 10-K text found for ${ticker}.`);
  }

  const openAiResult = await extractCompanyGraphRelationships({
    companyName: company.name,
    ticker,
    accessionNumber: filing.accessionNumber,
    filingDate: filing.filingDate,
    extractionText,
  });
  const nowIso = new Date().toISOString();
  const runId = `${ticker}_${filing.accessionNumber.replace(/-/g, "")}_${Date.now()}`;
  const usageEvent = await safeRecordOpenAiUsageEvent({
    purpose: "company_graph_extraction",
    model: openAiResult.model,
    responseId: openAiResult.responseId,
    usage: openAiResult.usage,
    createdAt: nowIso,
    metadata: {
      ticker,
      companyName: company.name,
      cik: company.cik,
      accessionNumber: filing.accessionNumber,
      filingDate: filing.filingDate,
      dryRun,
      force,
      runId,
    },
  });
  const extractedRelationships = openAiResult.relationships
    .filter((relationship) => relationship.confidence >= MIN_EDGE_CONFIDENCE);
  const resolvedTargetNames = await resolveCompanyGraphTargetNames(
    db,
    extractedRelationships.map((relationship) => relationship.targetName),
  );
  const edges: CompanyGraphEdge[] = collapseCompanyGraphEdges(extractedRelationships
    .map((relationship) => {
      const normalizedTargetName = canonicalCompanyName(relationship.targetName);
      const targetName = resolvedTargetNames.get(normalizedTargetName) ?? normalizedTargetName;
      return {
        id: edgeId({
          accessionNumber: filing.accessionNumber,
          sourceTicker: ticker,
          relationshipType: relationship.relationshipType,
          targetName,
          evidenceText: relationship.evidenceText,
        }),
        sourceName: company.name,
        sourceTicker: ticker,
        sourceCik: company.cik,
        targetName,
        targetType: relationship.targetType,
        relationshipType: relationship.relationshipType,
        direction: relationship.direction,
        evidenceText: relationship.evidenceText,
        filingType: "10-K" as const,
        accessionNumber: filing.accessionNumber,
        filingDate: filing.filingDate,
        reportDate: filing.reportDate,
        section: relationship.section,
        confidence: relationship.confidence,
        extractionProvider: "openai" as const,
        extractionModel: openAiResult.model,
        extractionRunId: runId,
        createdAt: nowIso,
      };
    }));

  const result: CompanyGraphExtractionResult = {
    runId,
    extractionVersion: COMPANY_GRAPH_EXTRACTION_VERSION,
    ticker,
    companyName: company.name,
    cik: company.cik,
    dryRun,
    cached: false,
    filing: {
      accessionNumber: filing.accessionNumber,
      filingDate: filing.filingDate,
      reportDate: filing.reportDate,
      primaryDocument: filing.primaryDocument,
      filingUrl: filing.filingUrl,
    },
    sections: storedSections.map((section) => ({
      id: section.id,
      title: section.title,
      available: section.available,
      charCount: section.charCount,
      storedCharCount: section.storedCharCount,
      truncated: section.truncated,
    })),
    extraction: {
      provider: "openai",
      model: openAiResult.model,
      responseId: openAiResult.responseId,
      usage: openAiResult.usage,
      usageEvent: usageEvent
        ? {
            id: usageEvent.id,
            estimatedCostUsd: usageEvent.estimatedCostUsd,
            inputTokens: usageEvent.inputTokens,
            cachedInputTokens: usageEvent.cachedInputTokens,
            outputTokens: usageEvent.outputTokens,
            totalTokens: usageEvent.totalTokens,
          }
        : null,
    },
    edges,
  };

  if (dryRun) {
    return result;
  }

  await db.collection("sec_filings").doc(filing.accessionNumber).set({
    accessionNumber: filing.accessionNumber,
    cik: company.cik,
    ticker,
    companyName: company.name,
    form: "10-K",
    filingDate: filing.filingDate,
    reportDate: filing.reportDate,
    primaryDocument: filing.primaryDocument,
    filingUrl: filing.filingUrl,
    updatedAt: nowIso,
    companyGraphLatestResult: {
      result,
    },
  }, { merge: true });

  for (const section of storedSections) {
    await db.collection("sec_filing_sections").doc(`${filing.accessionNumber}_${section.id}`).set({
      accessionNumber: filing.accessionNumber,
      sectionId: section.id,
      title: section.title,
      text: section.text,
      available: section.available,
      charCount: section.charCount,
      storedCharCount: section.storedCharCount,
      truncated: section.truncated,
      updatedAt: nowIso,
    }, { merge: true });
  }

  await persistEdges(db, edges);
  await runRef.set({
    ticker,
    cik: company.cik,
    companyName: company.name,
    accessionNumber: filing.accessionNumber,
    status: "COMPLETED",
    extractionVersion: COMPANY_GRAPH_EXTRACTION_VERSION,
    edgeCount: edges.length,
    updatedAt: nowIso,
    result,
  }, { merge: true });

  return result;
}
