import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const sessionCookieName = "chitflow_session";

function isProtectedPath(pathname: string) {
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/members") ||
    pathname.startsWith("/chit-funds") ||
    pathname.startsWith("/collections") ||
    pathname.startsWith("/auctions") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/notifications") ||
    pathname.startsWith("/exports")
  );
}

export function proxy(request: NextRequest) {
  if (!isProtectedPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(sessionCookieName)?.value;

  if (sessionCookie) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set(
    "next",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/members/:path*",
    "/chit-funds/:path*",
    "/collections/:path*",
    "/auctions/:path*",
    "/reports/:path*",
    "/notifications/:path*",
    "/exports/:path*",
  ],
};
