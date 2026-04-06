import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import type { SessionData } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const response = NextResponse.next();

  const session = await getIronSession<SessionData>(request, response, {
    password: process.env.SESSION_SECRET!,
    cookieName: "adl_session",
  });

  // Agent routes
  if (path.startsWith("/dashboard")) {
    if (session.role !== "agent") {
      return NextResponse.redirect(new URL("/login/agent", request.url));
    }
  }

  // Customer routes
  if (path.startsWith("/customer/")) {
    if (session.role !== "customer") {
      return NextResponse.redirect(new URL("/login/customer", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/customer/:path*"],
};
