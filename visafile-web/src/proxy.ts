import { NextResponse } from "next/server";

export function proxy() {
  if (process.env.VERCEL || process.env.EARLY_ACCESS_MODE === "true") {
    return new NextResponse("Not found", { status: 404 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/intake/:path*",
    "/applications/:path*",
    "/api/applications/:path*",
  ],
};
