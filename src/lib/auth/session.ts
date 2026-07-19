import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";

const COOKIE_NAME = "s360_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET env var is not set");
  return new TextEncoder().encode(secret);
}

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  /** The role currently being acted as. Every access check keys off this. */
  role: Role;
  /** The full set of roles this user holds; used for the role switcher. */
  roles: Role[];
};

export async function createSession(user: {
  id: string;
  name: string;
  email: string;
  roles: Role[];
  activeRole?: Role;
}) {
  const activeRole = user.activeRole ?? user.roles[0];

  const token = await new SignJWT({
    name: user.name,
    email: user.email,
    role: activeRole,
    roles: user.roles,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return {
      id: payload.sub as string,
      name: payload.name as string,
      email: payload.email as string,
      role: payload.role as Role,
      roles: (payload.roles as Role[]) ?? [payload.role as Role],
    };
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireRole(...allowed: Role[]): Promise<SessionUser> {
  const session = await requireUser();
  if (!allowed.includes(session.role)) redirect("/unauthorized");
  return session;
}

export const ROLE_HOME: Record<Role, string> = {
  FRONT_DESK: "/front-desk",
  COUNSELLOR: "/counsellor",
  APPLICATIONS_TEAM: "/applications",
  VISA_TEAM: "/visa",
  MANAGER: "/manager",
  ADMINISTRATOR: "/admin",
};
