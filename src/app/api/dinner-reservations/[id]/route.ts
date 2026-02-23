import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/server/firebaseAdmin";
import type { DinnerItem } from "@/app/types/dinner";

type PatchBody = {
  status?: DinnerItem["status"];
  dinner_customer_name?: string;
  dinner_adult_count?: number;
  dinner_child_count?: number;
  dinner_time?: string | null;
  memo?: string;
};

const isStatus = (value: unknown): value is DinnerItem["status"] => {
  return value === "coming" || value === "canceled" || value === "done";
};

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ errors: ["id is required"] }, { status: 400 });
  }

  try {
    const body = (await request.json()) as PatchBody;
    const patch: Record<string, unknown> = {};

    if (body.status !== undefined) {
      if (!isStatus(body.status)) {
        return NextResponse.json({ errors: ["Invalid status"] }, { status: 400 });
      }
      patch.status = body.status;
    }

    if (body.dinner_customer_name !== undefined) {
      if (typeof body.dinner_customer_name !== "string") {
        return NextResponse.json({ errors: ["Invalid dinner_customer_name"] }, { status: 400 });
      }
      patch.dinner_customer_name = body.dinner_customer_name;
    }

    if (body.dinner_adult_count !== undefined) {
      if (!Number.isInteger(body.dinner_adult_count)) {
        return NextResponse.json({ errors: ["Invalid dinner_adult_count"] }, { status: 400 });
      }
      patch.dinner_adult_count = body.dinner_adult_count;
    }

    if (body.dinner_child_count !== undefined) {
      if (!Number.isInteger(body.dinner_child_count)) {
        return NextResponse.json({ errors: ["Invalid dinner_child_count"] }, { status: 400 });
      }
      patch.dinner_child_count = body.dinner_child_count;
    }

    if (body.memo !== undefined) {
      if (typeof body.memo !== "string") {
        return NextResponse.json({ errors: ["Invalid memo"] }, { status: 400 });
      }
      patch.memo = body.memo;
    }

    if (body.dinner_time !== undefined) {
      if (body.dinner_time === null) {
        patch.dinner_time = null;
      } else if (typeof body.dinner_time === "string") {
        const parsed = new Date(body.dinner_time);
        if (Number.isNaN(parsed.getTime())) {
          return NextResponse.json({ errors: ["Invalid dinner_time"] }, { status: 400 });
        }
        patch.dinner_time = parsed;
      } else {
        return NextResponse.json({ errors: ["Invalid dinner_time"] }, { status: 400 });
      }
    }

    patch.updated_at = new Date();

    const db = getAdminDb();
    const ref = db.collection("dinnerReservations").doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ errors: ["Reservation not found"] }, { status: 404 });
    }

    await ref.update(patch);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ errors: [`Failed to update dinner reservation: ${message}`] }, { status: 500 });
  }
}
