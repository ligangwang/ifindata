import { getAdminFirestore } from "@/lib/firebase/admin";
import {
  COMPANY_GRAPH_EXTRACTION_VERSION,
  type CompanyGraphEdge,
} from "@/lib/company-graph/types";
import { FieldPath } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

const MAX_EDGES = 40;

type CompanyGraphRunDocument = {
  companyName?: unknown;
  cik?: unknown;
  accessionNumber?: unknown;
  result?: unknown;
  extractionVersion?: unknown;
  updatedAt?: unknown;
};

function normalizeTicker(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z0-9.-]/g, "");
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readRunResult(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const source = value as Record<string, unknown>;
  const filing = source.filing && typeof source.filing === "object"
    ? source.filing as Record<string, unknown>
    : null;

  return {
    runId: readString(source.runId),
    filing: filing
      ? {
          accessionNumber: readString(filing.accessionNumber),
          filingDate: readString(filing.filingDate),
          reportDate: readString(filing.reportDate),
          filingUrl: readString(filing.filingUrl),
        }
      : null,
  };
}

function sortEdges(left: CompanyGraphEdge, right: CompanyGraphEdge): number {
  const confidenceDelta = right.confidence - left.confidence;
  if (confidenceDelta !== 0) {
    return confidenceDelta;
  }

  return left.targetName.localeCompare(right.targetName);
}

function edgeDocIdPrefix(ticker: string, accessionNumber: string): string {
  return `${ticker}_${accessionNumber.replace(/-/g, "")}_`;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ ticker: string }> },
) {
  const { ticker: rawTicker } = await context.params;
  const ticker = normalizeTicker(rawTicker);

  if (!ticker) {
    return NextResponse.json({ error: "ticker is required" }, { status: 400 });
  }

  try {
    const db = getAdminFirestore();
    const runSnapshot = await db.collection("company_graph_runs").doc(`${ticker}_latest_10k`).get();
    const runData = runSnapshot.data() as CompanyGraphRunDocument | undefined;
    const runResult = readRunResult(runData?.result);
    const extractionVersion = readString(runData?.extractionVersion);
    const isCurrentExtractionVersion = extractionVersion === COMPANY_GRAPH_EXTRACTION_VERSION;
    const latestAccessionNumber = readString(runData?.accessionNumber) ?? runResult?.filing?.accessionNumber ?? null;
    const edgePrefix = isCurrentExtractionVersion && latestAccessionNumber
      ? edgeDocIdPrefix(ticker, latestAccessionNumber)
      : null;
    const edgesSnapshot = edgePrefix
      ? await db
          .collection("company_graph_edges")
          .where(FieldPath.documentId(), ">=", edgePrefix)
          .where(FieldPath.documentId(), "<", `${edgePrefix}\uf8ff`)
          .orderBy(FieldPath.documentId())
          .limit(100)
          .get()
      : null;
    const edges = edgesSnapshot
      ? edgesSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }) as CompanyGraphEdge)
          .sort(sortEdges)
          .slice(0, MAX_EDGES)
      : [];

    return NextResponse.json({
      ticker,
      available: edges.length > 0,
      extractionVersion,
      companyName: readString(runData?.companyName),
      cik: readString(runData?.cik),
      accessionNumber: latestAccessionNumber,
      updatedAt: readString(runData?.updatedAt),
      runId: runResult?.runId ?? null,
      filing: runResult?.filing ?? null,
      edges,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch company graph";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
