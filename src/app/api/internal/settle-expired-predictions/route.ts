import { isInternalRequest } from "@/lib/firebase/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  if (!isInternalRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(
    { error: "This endpoint is no longer supported. Positions stay OPEN until explicitly closed." },
    { status: 410 },
  );
}
