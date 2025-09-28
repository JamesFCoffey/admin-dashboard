import { NextRequest, NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password"];
const COOKIE_NAMES = [
  "__Secure-next-auth.session-token",
  "next-auth.session-token",
];

const shouldBypass = (pathname: string) => {
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/api/auth")) return true;
  if (pathname.startsWith("/favicon.ico")) return true;
  if (pathname.startsWith("/assets")) return true;
  if (pathname.startsWith("/robots.txt")) return true;
  if (pathname.startsWith("/sitemap.xml")) return true;
  return false;
};

const hasSessionCookie = (request: NextRequest) =>
  COOKIE_NAMES.some((cookie) => request.cookies.has(cookie));

export function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const pathname = nextUrl.pathname.toLowerCase();

  if (shouldBypass(pathname)) {
    return NextResponse.next();
  }

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  const isAuthenticated = hasSessionCookie(request);

  if (isPublicRoute) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    const loginUrl = new URL("/login", request.url);

    if (!pathname.startsWith("/login")) {
      loginUrl.searchParams.set("redirect", `${nextUrl.pathname}${nextUrl.search}`);
    }

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|api/auth|favicon.ico|assets|robots.txt|sitemap.xml).*)",
  ],
};
