import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "s360_session";

const ROLE_PREFIXES: Record<string, string[]> = {
  "/front-desk": ["FRONT_DESK", "MANAGER"],
  "/counsellor": ["COUNSELLOR", "MANAGER"],
  "/applications": ["APPLICATIONS_TEAM", "MANAGER"],
  "/visa": ["VISA_TEAM", "COUNSELLOR", "MANAGER"],
  "/manager": ["MANAGER"],
  "/admin": ["ADMINISTRATOR"],
  "/students": ["COUNSELLOR", "APPLICATIONS_TEAM", "VISA_TEAM", "MANAGER"],
  "/study-options": ["COUNSELLOR", "APPLICATIONS_TEAM", "MANAGER"],
  "/work-items": ["COUNSELLOR", "APPLICATIONS_TEAM", "VISA_TEAM", "MANAGER"],
};

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET env var is not set");
  return new TextEncoder().encode(secret);
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const matchedPrefix = Object.keys(ROLE_PREFIXES).find(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  if (!matchedPrefix) return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const role = payload.role as string;
    if (!ROLE_PREFIXES[matchedPrefix].includes(role)) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: [
    "/front-desk/:path*",
    "/counsellor/:path*",
    "/applications/:path*",
    "/visa/:path*",
    "/manager/:path*",
    "/admin/:path*",
    "/students/:path*",
    "/study-options/:path*",
    "/work-items/:path*",
  ],
};
