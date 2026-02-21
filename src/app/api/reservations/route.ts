import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/server/firebaseAdmin";

type GuestInfoV2ReservationRaw = {
  dinner?: unknown;
  dinner_time?: unknown;
  cancel?: unknown;
  check_in_date?: unknown;
  check_out_date?: unknown;
  adult_count?: unknown;
  child_count?: unknown;
  guest_name?: unknown;
};

type ApiReservationRow = {
  id: string;
  reservation_number: string;
  origin: "ryokan-system-front";
  dateKey: string;
  status: "coming";
  dinner_customer_name: string;
  dinner_adult_count: number;
  dinner_child_count: number;
  dinner_time: string;
  memo: string;
};

const YEAR_MONTH_PATTERN = /^\d{4}-\d{2}$/;
const HHMM_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const parseSlashDate = (value: string) => {
  const [yearStr, monthStr, dayStr] = value.split("/");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (![year, month, day].every((n) => Number.isFinite(n))) return null;
  const date = new Date(year, month - 1, day, 0, 0, 0, 0);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
};

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toIsoDateTime = (date: Date, hhmm: string) => {
  const [hourStr, minuteStr] = hhmm.split(":");
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  if (![hour, minute].every((n) => Number.isFinite(n))) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute, 0, 0).toISOString();
};

const getErrorLabel = (raw: GuestInfoV2ReservationRaw, dateText?: string) => {
  const name = typeof raw.guest_name === "string" && raw.guest_name.trim().length > 0
    ? raw.guest_name
    : "名前不明";
  const date = dateText
    ?? (typeof raw.check_in_date === "string" ? raw.check_in_date : "日付不明");
  return `${date} / ${name}`;
};

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const yearMonth = searchParams.get("yearMonth") ?? "";

  if (!YEAR_MONTH_PATTERN.test(yearMonth)) {
    return NextResponse.json(
      {
        rows: [],
        errors: ["Invalid yearMonth. Expected format: YYYY-MM"],
      },
      { status: 400 }
    );
  }

  try {
    const db = getAdminDb();
    const snapshot = await db.collection("guestInfoV2").get();

    const rows: ApiReservationRow[] = [];
    const errors: string[] = [];

    snapshot.forEach((doc) => {
      const raw = doc.data() as GuestInfoV2ReservationRaw;

      if (raw.dinner !== 1) return;
      if (raw.cancel === 1) return;

      if (typeof raw.check_in_date !== "string" || typeof raw.check_out_date !== "string") {
        errors.push(`${getErrorLabel(raw)}: check_in_date/check_out_date が不正なため除外しました。`);
        return;
      }

      const checkIn = parseSlashDate(raw.check_in_date);
      const checkOut = parseSlashDate(raw.check_out_date);
      if (!checkIn || !checkOut || checkOut <= checkIn) {
        errors.push(`${getErrorLabel(raw)}: 宿泊日が不正なため除外しました。`);
        return;
      }

      if (!Array.isArray(raw.dinner_time)) {
        errors.push(`${getErrorLabel(raw)}: dinner_time が配列でないため除外しました。`);
        return;
      }

      const nights = Math.floor((checkOut.getTime() - checkIn.getTime()) / (24 * 60 * 60 * 1000));
      if (raw.dinner_time.length !== nights) {
        errors.push(
          `${getErrorLabel(raw)}: dinner_time の件数(${raw.dinner_time.length})と泊数(${nights})が不一致のため除外しました。`
        );
        return;
      }

      if (typeof raw.guest_name !== "string") {
        errors.push(`${getErrorLabel(raw)}: guest_name が不正なため除外しました。`);
        return;
      }

      if (
        typeof raw.adult_count !== "number" ||
        typeof raw.child_count !== "number" ||
        !Number.isInteger(raw.adult_count) ||
        !Number.isInteger(raw.child_count) ||
        raw.adult_count < 0 ||
        raw.child_count < 0 ||
        raw.adult_count > 9 ||
        raw.child_count > 9
      ) {
        errors.push(`${getErrorLabel(raw)}: adult_count/child_count が不正なため除外しました。`);
        return;
      }

      for (let i = 0; i < nights; i += 1) {
        const stayDate = new Date(checkIn);
        stayDate.setDate(checkIn.getDate() + i);
        const dateKey = toDateKey(stayDate);
        if (!dateKey.startsWith(`${yearMonth}-`)) continue;

        const timeValue = raw.dinner_time[i];
        if (timeValue === null) continue;
        if (typeof timeValue !== "string" || !HHMM_PATTERN.test(timeValue)) {
          errors.push(`${getErrorLabel(raw, dateKey)}: dinner_time[${i}] が不正なため当日分を除外しました。`);
          continue;
        }

        const dinnerTime = toIsoDateTime(stayDate, timeValue);
        if (!dinnerTime) continue;

        rows.push({
          id: `${doc.id}_${dateKey}`,
          reservation_number: doc.id,
          origin: "ryokan-system-front",
          dateKey,
          status: "coming",
          dinner_customer_name: raw.guest_name,
          dinner_adult_count: raw.adult_count,
          dinner_child_count: raw.child_count,
          dinner_time: dinnerTime,
          memo: "",
        });
      }
    });

    rows.sort((a, b) => {
      if (a.dateKey !== b.dateKey) return a.dateKey.localeCompare(b.dateKey);
      if (a.dinner_time !== b.dinner_time) return a.dinner_time.localeCompare(b.dinner_time);
      return a.id.localeCompare(b.id);
    });

    return NextResponse.json({ rows, errors });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        rows: [],
        errors: [`Failed to fetch guestInfoV2 from Firestore: ${message}`],
      },
      { status: 500 }
    );
  }
}
