import { NextRequest, NextResponse } from "next/server";
import { getCompanyWithRelationships } from "@/lib/graph/repository";

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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const types = parseTypes(request.nextUrl.searchParams);
  const payload = await getCompanyWithRelationships(id, types);

  if (!payload) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  return NextResponse.json(payload);
}
