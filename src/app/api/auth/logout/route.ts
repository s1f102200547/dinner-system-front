import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/server/firebaseAdmin";
import { verifySessionFromRequest } from "@/lib/server/auth";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const decoded = await verifySessionFromRequest(request);
    if (decoded) {
      await getAdminAuth().revokeRefreshTokens(decoded.uid);
    }
  } catch {
    // Continue logout even if revocation fails.
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
