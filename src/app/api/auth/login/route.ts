import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/server/firebaseAdmin";
import { SESSION_MAX_AGE_MS, SESSION_MAX_AGE_SECONDS } from "@/lib/server/auth";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";

type LoginBody = {
  idToken?: string;
};

export const runtime = "nodejs";

const isE2EAuthMockEnabled = () => process.env.E2E_AUTH_MOCK === "1";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginBody;
    if (!body.idToken || typeof body.idToken !== "string") {
      return NextResponse.json({ errors: ["idToken is required"] }, { status: 400 });
    }

    if (isE2EAuthMockEnabled()) {
      if (body.idToken !== "e2e.valid.id-token") {
        return NextResponse.json({ errors: ["Login failed: invalid idToken"] }, { status: 401 });
      }

      const response = NextResponse.json({ ok: true });
      response.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: `e2e.session.${Date.now()}`,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_MAX_AGE_SECONDS,
      });
      return response;
    }

    const adminAuth = getAdminAuth();
    const decoded = await adminAuth.verifyIdToken(body.idToken);
    const user = await adminAuth.getUser(decoded.uid);
    if (user.disabled) {
      return NextResponse.json({ errors: ["User is disabled"] }, { status: 401 });
    }

    const sessionCookie = await adminAuth.createSessionCookie(body.idToken, {
      expiresIn: SESSION_MAX_AGE_MS,
    });

    const response = NextResponse.json({ ok: true });
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionCookie,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ errors: [`Login failed: ${message}`] }, { status: 401 });
  }
}
