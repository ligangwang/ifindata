import { NextRequest, NextResponse } from "next/server";
import { getGraph } from "@/lib/graph/repository";

function parseTypes(searchParams: URLSearchParams): string[] | undefined {
  const csv = searchParams.get("types")?.trim();
  if (!csv) {
    return undefined;
  }

  return csv
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

function parseMaxNodes(searchParams: URLSearchParams): number {
  const raw = Number(searchParams.get("maxNodes") ?? "50");
  if (!Number.isFinite(raw) || raw <= 0) {
    return 50;
  }

  return Math.min(50, Math.floor(raw));
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const maxNodes = parseMaxNodes(request.nextUrl.searchParams);
  const types = parseTypes(request.nextUrl.searchParams);

  const payload = await getGraph(id, types, maxNodes);
  if (!payload) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  return NextResponse.json(payload);
}
