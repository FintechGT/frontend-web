import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value || req.headers.get("authorization") || null;

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
