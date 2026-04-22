import { getOpenAiApiKey, getOpenAiModel } from "@/lib/ai-analyst/runtime";

type GenerateCallDecision = {
  action: "NO_CALL" | "CREATE_CALL";
  ticker: string;
  direction: "UP" | "DOWN" | null;
  thesisTitle: string | null;
  thesis: string | null;
  confidence: number | null;
  catalyst: string | null;
  signals: string[];
  risks: string[];
  timeHorizon: {
    value: number;
    unit: "DAYS" | "MONTHS" | "YEARS";
  } | null;
  rationale: string | null;
};

export type GenerateCallsPayload = {
  analyst: {
    id: string;
    displayName: string;
    badgeLabel: string;
    theme: string;
  };
  rules: {
    oneOpenCallPerTicker: boolean;
    maxOpenCallsPerTicker: number;
    requiresAdminReview: boolean;
    mayPublishZeroCalls: boolean;
    minPublishConfidence: number;
  };
  coverage: {
    tickers: string[];
    thesisScope: string[];
  };
  existingOpenCalls: Array<{
    predictionId: string;
    ticker: string;
    direction: "UP" | "DOWN";
    thesisTitle: string;
    confidence: number | null;
    catalyst: string | null;
    createdAt: string;
    entryDate: string | null;
    markReturnValue: number | null;
    targetDate: string | null;
    status: string;
  }>;
  eligibleTickers: string[];
  runDate: string;
};

export type OpenAiGenerationResult = {
  model: string;
  responseId: string | null;
  outputText: string;
  decisions: GenerateCallDecision[];
  usage: Record<string, unknown> | null;
};

const RESPONSE_SCHEMA = {
  name: "ai_analyst_generation",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["decisions"],
    properties: {
      decisions: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: [
            "action",
            "ticker",
            "direction",
            "thesisTitle",
            "thesis",
            "confidence",
            "catalyst",
            "signals",
            "risks",
            "timeHorizon",
            "rationale",
          ],
          properties: {
            action: {
              type: "string",
              enum: ["NO_CALL", "CREATE_CALL"],
            },
            ticker: { type: "string" },
            direction: {
              anyOf: [
                { type: "string", enum: ["UP", "DOWN"] },
                { type: "null" },
              ],
            },
            thesisTitle: {
              anyOf: [{ type: "string" }, { type: "null" }],
            },
            thesis: {
              anyOf: [{ type: "string" }, { type: "null" }],
            },
            confidence: {
              anyOf: [{ type: "number" }, { type: "null" }],
            },
            catalyst: {
              anyOf: [{ type: "string" }, { type: "null" }],
            },
            signals: {
              type: "array",
              items: { type: "string" },
            },
            risks: {
              type: "array",
              items: { type: "string" },
            },
            timeHorizon: {
              anyOf: [
                {
                  type: "object",
                  additionalProperties: false,
                  required: ["value", "unit"],
                  properties: {
                    value: { type: "integer", minimum: 1 },
                    unit: {
                      type: "string",
                      enum: ["DAYS", "MONTHS", "YEARS"],
                    },
                  },
                },
                { type: "null" },
              ],
            },
            rationale: {
              anyOf: [{ type: "string" }, { type: "null" }],
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

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim())
    : [];
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

function normalizeDecisions(raw: unknown): GenerateCallDecision[] {
  const decisions = Array.isArray(raw) ? raw : [];

  return decisions.map((item) => {
    const source = item && typeof item === "object" ? item as Record<string, unknown> : {};
    const unit = source.timeHorizon && typeof source.timeHorizon === "object"
      ? (source.timeHorizon as Record<string, unknown>).unit
      : null;
    const value = source.timeHorizon && typeof source.timeHorizon === "object"
      ? (source.timeHorizon as Record<string, unknown>).value
      : null;

    return {
      action: source.action === "CREATE_CALL" ? "CREATE_CALL" : "NO_CALL",
      ticker: asString(source.ticker) ?? "",
      direction: source.direction === "UP" || source.direction === "DOWN" ? source.direction : null,
      thesisTitle: asString(source.thesisTitle),
      thesis: asString(source.thesis),
      confidence: asNumber(source.confidence),
      catalyst: asString(source.catalyst),
      signals: asStringArray(source.signals),
      risks: asStringArray(source.risks),
      timeHorizon:
        (unit === "DAYS" || unit === "MONTHS" || unit === "YEARS") && Number.isInteger(value) && Number(value) > 0
          ? { value: Number(value), unit }
          : null,
      rationale: asString(source.rationale),
    };
  });
}

export async function generateAiAnalystCalls(payload: GenerateCallsPayload): Promise<OpenAiGenerationResult> {
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
                "You are an AI equity analyst generating selective prediction drafts for a public analyst account. " +
                "You must return JSON only. Evaluate the covered universe for this run date. " +
                "Prefer NO_CALL unless there is a clear setup. Never create a new call for a ticker that already has an open call. " +
                "For CREATE_CALL, include a direction, concise thesis title, thesis, confidence between 0 and 1, catalyst, signals, risks, and time horizon. " +
                "For NO_CALL, return the ticker, action=NO_CALL, and use null for non-applicable fields.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify(payload),
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
      `OpenAI generation failed: ${
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
    outputText,
    decisions: normalizeDecisions(parsed.decisions),
    usage: responseBody.usage && typeof responseBody.usage === "object"
      ? responseBody.usage as Record<string, unknown>
      : null,
  };
}

