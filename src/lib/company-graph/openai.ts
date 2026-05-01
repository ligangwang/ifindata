import { getOpenAiApiKey, getOpenAiModel } from "@/lib/ai-analyst/runtime";
import {
  COMPANY_GRAPH_RELATIONSHIP_TYPES,
  COMPANY_GRAPH_TARGET_TYPES,
  type CompanyGraphRelationshipType,
  type CompanyGraphTargetType,
} from "@/lib/company-graph/types";

export type ExtractedCompanyGraphRelationship = {
  sourceName: string;
  targetName: string;
  targetType: CompanyGraphTargetType;
  relationshipType: CompanyGraphRelationshipType;
  evidenceText: string;
  section: "item1" | "item1a" | "unknown";
  confidence: number;
};

export type OpenAiCompanyGraphExtractionResult = {
  model: string;
  responseId: string | null;
  relationships: ExtractedCompanyGraphRelationship[];
  outputText: string;
  usage: Record<string, unknown> | null;
};

const RESPONSE_SCHEMA = {
  name: "company_graph_extraction",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["relationships"],
    properties: {
      relationships: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: [
            "sourceName",
            "targetName",
            "targetType",
            "relationshipType",
            "evidenceText",
            "section",
            "confidence",
          ],
          properties: {
            sourceName: { type: "string" },
            targetName: { type: "string" },
            targetType: {
              type: "string",
              enum: COMPANY_GRAPH_TARGET_TYPES,
            },
            relationshipType: {
              type: "string",
              enum: COMPANY_GRAPH_RELATIONSHIP_TYPES,
            },
            evidenceText: { type: "string" },
            section: {
              type: "string",
              enum: ["item1", "item1a", "unknown"],
            },
            confidence: {
              type: "number",
              minimum: 0,
              maximum: 1,
            },
          },
        },
      },
    },
  },
} as const;

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asConfidence(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}

function asTargetType(value: unknown): CompanyGraphTargetType | null {
  return typeof value === "string" && (COMPANY_GRAPH_TARGET_TYPES as readonly string[]).includes(value)
    ? value as CompanyGraphTargetType
    : null;
}

function asRelationshipType(value: unknown): CompanyGraphRelationshipType | null {
  return typeof value === "string" && (COMPANY_GRAPH_RELATIONSHIP_TYPES as readonly string[]).includes(value)
    ? value as CompanyGraphRelationshipType
    : null;
}

function asSection(value: unknown): "item1" | "item1a" | "unknown" {
  return value === "item1" || value === "item1a" ? value : "unknown";
}

function extractOutputText(responseBody: Record<string, unknown>): string {
  const direct = responseBody.output_text;
  if (typeof direct === "string" && direct.trim()) {
    return direct;
  }

  const output = Array.isArray(responseBody.output) ? responseBody.output : [];
  for (const item of output) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const content = Array.isArray((item as Record<string, unknown>).content)
      ? (item as Record<string, unknown>).content as Array<Record<string, unknown>>
      : [];
    for (const part of content) {
      if (part?.type === "output_text" && typeof part.text === "string" && part.text.trim()) {
        return part.text;
      }
    }
  }

  throw new Error("OpenAI response did not include output text.");
}

function normalizeRelationships(raw: unknown): ExtractedCompanyGraphRelationship[] {
  const relationships = Array.isArray(raw) ? raw : [];

  return relationships.flatMap((item) => {
    const source = item && typeof item === "object" ? item as Record<string, unknown> : {};
    const sourceName = asString(source.sourceName);
    const targetName = asString(source.targetName);
    const targetType = asTargetType(source.targetType);
    const relationshipType = asRelationshipType(source.relationshipType);
    const evidenceText = asString(source.evidenceText);

    if (!sourceName || !targetName || !targetType || !relationshipType || !evidenceText) {
      return [];
    }

    return [{
      sourceName,
      targetName,
      targetType,
      relationshipType,
      evidenceText,
      section: asSection(source.section),
      confidence: asConfidence(source.confidence),
    }];
  });
}

export async function extractCompanyGraphRelationships(input: {
  companyName: string;
  ticker: string;
  accessionNumber: string;
  filingDate: string;
  extractionText: string;
}): Promise<OpenAiCompanyGraphExtractionResult> {
  const model = getOpenAiModel();
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${getOpenAiApiKey()}`,
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text:
                "Extract a company relationship knowledge graph from SEC 10-K text. Return only relationships explicitly supported by the evidence text. " +
                "Prioritize named vendors, suppliers, customers, competitors, partners, executives, directors, subsidiaries, products, markets, geographies, and risks. " +
                "Do not infer unnamed entities, do not turn generic categories into companies, and keep evidenceText short but verbatim enough to audit the edge.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify({
                companyName: input.companyName,
                ticker: input.ticker,
                accessionNumber: input.accessionNumber,
                filingDate: input.filingDate,
                text: input.extractionText,
              }),
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          ...RESPONSE_SCHEMA,
        },
      },
    }),
  });

  const responseBody = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(
      `OpenAI company graph extraction failed: ${
        typeof responseBody.error === "object" && responseBody.error && "message" in responseBody.error
          ? String((responseBody.error as Record<string, unknown>).message)
          : response.statusText
      }`,
    );
  }

  const outputText = extractOutputText(responseBody);
  const parsed = JSON.parse(outputText) as Record<string, unknown>;

  return {
    model,
    responseId: asString(responseBody.id),
    relationships: normalizeRelationships(parsed.relationships),
    outputText,
    usage: responseBody.usage && typeof responseBody.usage === "object"
      ? responseBody.usage as Record<string, unknown>
      : null,
  };
}
