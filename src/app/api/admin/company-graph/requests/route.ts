import { isAdminUser } from "@/lib/firebase/admin-role";
import { getDecodedUserFromRequest } from "@/lib/firebase/auth";
import { listCompanyGraphRequests } from "@/lib/company-graph/requests";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const decoded = await getDecodedUserFromRequest(request);

  if (!decoded) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await isAdminUser(decoded))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    return NextResponse.json({
      items: await listCompanyGraphRequests(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load company graph requests";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
