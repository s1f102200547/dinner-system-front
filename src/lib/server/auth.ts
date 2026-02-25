import { NextResponse } from "next/server";
import type { DecodedIdToken } from "firebase-admin/auth";
import { getAdminAuth } from "@/lib/server/firebaseAdmin";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";

export const SESSION_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;
export const SESSION_MAX_AGE_SECONDS = Math.floor(SESSION_MAX_AGE_MS / 1000);

const parseCookie = (cookieHeader: string | null): Record<string, string> => {
  if (!cookieHeader) return {};
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, part) => {
      const eq = part.indexOf("=");
      if (eq <= 0) return acc;
      const key = part.slice(0, eq).trim();
      const value = part.slice(eq + 1).trim();
      if (!key) return acc;
      acc[key] = decodeURIComponent(value);
      return acc;
    }, {});
};

export const getSessionCookieFromRequest = (request: Request) => {
  const cookies = parseCookie(request.headers.get("cookie"));
  return cookies[SESSION_COOKIE_NAME] ?? null;
};

export const verifySessionFromRequest = async (request: Request): Promise<DecodedIdToken | null> => {
  const sessionCookie = getSessionCookieFromRequest(request);
  if (!sessionCookie) return null;

  const isE2EAuthMockAllowed =
    process.env.E2E_AUTH_MOCK === "1" &&
    process.env.PLAYWRIGHT_TEST === "1";
  if (isE2EAuthMockAllowed) {
    if (!sessionCookie.startsWith("e2e.session.")) return null;
    const uid = sessionCookie.replace("e2e.session.", "");
    if (!uid || uid === "deleted-user" || uid === "disabled-user") return null;
    return {
      uid,
      email: `${uid}@example.com`,
    } as DecodedIdToken;
  }

  try {
    const adminAuth = getAdminAuth();
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const user = await adminAuth.getUser(decoded.uid);
    if (user.disabled) return null;
    return decoded;
  } catch {
    return null;
  }
};

export const requireSessionFromRequest = async (request: Request) => {
  const decoded = await verifySessionFromRequest(request);
  if (!decoded) {
    return {
      ok: false as const,
      response: NextResponse.json({ errors: ["Unauthorized"] }, { status: 401 }),
    };
  }
  return { ok: true as const, decoded };
};
