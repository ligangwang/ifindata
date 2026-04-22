import { isInternalRequest } from "@/lib/firebase/auth";
import { runAiAnalystGenerate } from "@/lib/ai-analyst/generate";
import { NextRequest, NextResponse } from "next/server";

type GenerateRequest = {
  runDate?: unknown;
  dryRun?: unknown;
  force?: unknown;
};

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function statusFromError(message: string): number {
  if (/not completed/i.test(message)) {
    return 409;
  }
  if (/missing ai_analyst_user_id|missing openai_api_key/i.test(message.toLowerCase())) {
    return 500;
  }
  return 500;
}

export async function POST(request: NextRequest) {
  if (!isInternalRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = (await request.json().catch(() => ({}))) as GenerateRequest;
    const result = await runAiAnalystGenerate({
      runDate: readString(payload.runDate),
      dryRun: readBoolean(payload.dryRun),
      force: readBoolean(payload.force),
    });

    return NextResponse.json({
      ok: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to run AI analyst generate job";
    return NextResponse.json({ error: message }, { status: statusFromError(message) });
  }
}

