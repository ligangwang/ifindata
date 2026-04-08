import { NextRequest, NextResponse } from "next/server";
import { searchCompanies } from "@/lib/graph/repository";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";
  const limitRaw = Number(request.nextUrl.searchParams.get("limit") ?? "10");
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(20, Math.floor(limitRaw))) : 10;

  if (!query.trim()) {
    return NextResponse.json({ companies: [] });
  }

  const companies = await searchCompanies(query, limit);
  return NextResponse.json({ companies });
}
