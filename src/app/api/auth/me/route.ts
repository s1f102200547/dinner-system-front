import { NextResponse } from "next/server";
import { verifySessionFromRequest } from "@/lib/server/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const decoded = await verifySessionFromRequest(request);
  if (!decoded) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      uid: decoded.uid,
      email: decoded.email ?? null,
    },
  });
}
