import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const REDIRECT_HOSTS = new Set([
  "www.youanalyst.com",
  "younalyst.com",
  "www.younalyst.com",
  "ifindata.com",
  "www.ifindata.com",
]);
const CANONICAL_HOST = "youanalyst.com";

export function middleware(request: NextRequest) {
  const hostHeader = request.headers.get("host");
  const requestHost = hostHeader?.split(":")[0]?.toLowerCase() ?? "";

  if (!REDIRECT_HOSTS.has(requestHost)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.protocol = "https";
  url.hostname = CANONICAL_HOST;
  url.port = "";

  return NextResponse.redirect(url, 308);
}
