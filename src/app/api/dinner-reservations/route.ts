import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/server/firebaseAdmin";
import { requireSessionFromRequest } from "@/lib/server/auth";
import type { DinnerItem } from "@/app/types/dinner";

type DinnerReservationDoc = {
  origin?: unknown;
  status?: unknown;
  dateKey?: unknown;
  dinner_customer_name?: unknown;
  dinner_adult_count?: unknown;
  dinner_child_count?: unknown;
  dinner_time?: unknown;
  memo?: unknown;
  created_by?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
};

type DinnerReservationRow = {
  id: string;
  origin: "dinner-system-front";
  status: DinnerItem["status"];
  dateKey: string;
  dinner_customer_name: string;
  dinner_adult_count: number;
  dinner_child_count: number;
  dinner_time: string | null;
  memo: string;
  created_by: "dinner_front";
  created_at: string;
  updated_at: string;
};

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const ISO_PATTERN = /^\d{4}-\d{2}-\d{2}T/;
const HHMM_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const normalizeStatus = (value: unknown): DinnerItem["status"] | null => {
  if (value === "coming" || value === "done" || value === "canceled_stay" || value === "canceled_dinner") {
    return value;
  }
  if (value === "canceled") return "canceled_stay";
  return null;
};

const toIso = (value: unknown) => {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" && ISO_PATTERN.test(value)) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  if (value && typeof value === "object" && "toDate" in value && typeof (value as { toDate?: unknown }).toDate === "function") {
    const date = (value as { toDate: () => Date }).toDate();
    if (date instanceof Date && !Number.isNaN(date.getTime())) return date.toISOString();
  }
  return null;
};

const toDinnerTime = (value: unknown): string | null => {
  if (value === null) return null;
  if (typeof value === "string" && HHMM_PATTERN.test(value)) return value;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Tokyo",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(value);
  }
  if (typeof value === "string" && ISO_PATTERN.test(value)) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) {
      return new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Tokyo",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).format(d);
    }
  }
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    const date = (value as { toDate: () => Date }).toDate();
    if (date instanceof Date && !Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Tokyo",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).format(date);
    }
  }
  return null;
};

const toRow = (id: string, raw: DinnerReservationDoc): DinnerReservationRow | null => {
  if (raw.origin !== "dinner-system-front") return null;
  const status = normalizeStatus(raw.status);
  if (!status) return null;
  if (typeof raw.dateKey !== "string" || !DATE_KEY_PATTERN.test(raw.dateKey)) return null;
  if (typeof raw.dinner_customer_name !== "string") return null;
  if (typeof raw.dinner_adult_count !== "number" || !Number.isInteger(raw.dinner_adult_count)) return null;
  if (typeof raw.dinner_child_count !== "number" || !Number.isInteger(raw.dinner_child_count)) return null;
  if (typeof raw.memo !== "string") return null;
  if (raw.created_by !== "dinner_front") return null;

  const dinnerTime = toDinnerTime(raw.dinner_time);
  if (raw.dinner_time !== null && raw.dinner_time !== undefined && dinnerTime === null) return null;

  const createdAt = toIso(raw.created_at);
  const updatedAt = toIso(raw.updated_at);
  if (!createdAt || !updatedAt) return null;

  return {
    id,
    origin: "dinner-system-front",
    status,
    dateKey: raw.dateKey,
    dinner_customer_name: raw.dinner_customer_name,
    dinner_adult_count: raw.dinner_adult_count,
    dinner_child_count: raw.dinner_child_count,
    dinner_time: dinnerTime,
    memo: raw.memo,
    created_by: "dinner_front",
    created_at: createdAt,
    updated_at: updatedAt,
  };
};

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await requireSessionFromRequest(request);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const dateKey = searchParams.get("dateKey") ?? "";

  if (!DATE_KEY_PATTERN.test(dateKey)) {
    return NextResponse.json({ rows: [], errors: ["Invalid dateKey. Expected format: YYYY-MM-DD"] }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const snapshot = await db
      .collection("dinnerReservations")
      .where("dateKey", "==", dateKey)
      .orderBy("dateKey", "asc")
      .limit(500)
      .get();

    const rows: DinnerReservationRow[] = [];
    const errors: string[] = [];

    snapshot.forEach((doc) => {
      const row = toRow(doc.id, doc.data() as DinnerReservationDoc);
      if (!row) {
        errors.push(`Invalid dinnerReservations document: id=${doc.id}`);
        return;
      }
      rows.push(row);
    });

    rows.sort((a, b) => {
      if (a.dateKey !== b.dateKey) return a.dateKey.localeCompare(b.dateKey);
      const at = a.dinner_time ?? "99:99";
      const bt = b.dinner_time ?? "99:99";
      if (at !== bt) return at.localeCompare(bt);
      return a.id.localeCompare(b.id);
    });

    return NextResponse.json({ rows, errors });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ rows: [], errors: [`Failed to fetch dinnerReservations: ${message}`] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireSessionFromRequest(request);
  if (!auth.ok) return auth.response;

  try {
    const body = (await request.json()) as Partial<DinnerReservationRow>;
    if (typeof body.dateKey !== "string" || !DATE_KEY_PATTERN.test(body.dateKey)) {
      return NextResponse.json({ errors: ["dateKey is required in YYYY-MM-DD format"] }, { status: 400 });
    }

    const status = normalizeStatus(body.status) ?? "coming";
    const customerName = typeof body.dinner_customer_name === "string" ? body.dinner_customer_name : "";
    const adultCount =
      typeof body.dinner_adult_count === "number" && Number.isInteger(body.dinner_adult_count)
        ? body.dinner_adult_count
        : 0;
    const childCount =
      typeof body.dinner_child_count === "number" && Number.isInteger(body.dinner_child_count)
        ? body.dinner_child_count
        : 0;
    const memo = typeof body.memo === "string" ? body.memo : "";

    let dinnerTime: string | null = null;
    if (typeof body.dinner_time === "string") {
      if (!HHMM_PATTERN.test(body.dinner_time)) {
        return NextResponse.json({ errors: ["dinner_time must be HH:mm string or null"] }, { status: 400 });
      }
      dinnerTime = body.dinner_time;
    }

    const now = new Date();
    const writeData = {
      origin: "dinner-system-front" as const,
      status,
      dateKey: body.dateKey,
      dinner_customer_name: customerName,
      dinner_adult_count: adultCount,
      dinner_child_count: childCount,
      dinner_time: dinnerTime,
      memo,
      created_by: "dinner_front" as const,
      created_at: now,
      updated_at: now,
    };

    const db = getAdminDb();
    const ref = db.collection("dinnerReservations").doc();
    await ref.set(writeData);

    const row: DinnerReservationRow = {
      id: ref.id,
      origin: "dinner-system-front",
      status,
      dateKey: body.dateKey,
      dinner_customer_name: customerName,
      dinner_adult_count: adultCount,
      dinner_child_count: childCount,
      dinner_time: dinnerTime,
      memo,
      created_by: "dinner_front",
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    return NextResponse.json({ row }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ errors: [`Failed to create dinner reservation: ${message}`] }, { status: 500 });
  }
}
