// dummyDinnerByDate.ts
import type { DinnerByDate, DinnerItem, DinnerStatus } from "@/app/types/dinner";

/**
 * dateKey(YYYY-MM-DD) と hh:mm から Date を生成
 */
const dt = (dateKey: string, hhmm: string) => {
  const [yearStr, monthStr, dayStr] = dateKey.split("-");
  const [hourStr, minuteStr] = hhmm.split(":");
  return new Date(
    Number(yearStr),
    Number(monthStr) - 1,
    Number(dayStr),
    Number(hourStr),
    Number(minuteStr),
    0,
    0
  );
};

/**
 * DinnerItem を簡潔に生成するヘルパー
 */
const item = (params: {
  id: string;
  origin?: DinnerItem["origin"];
  dateKey: string;
  status?: DinnerStatus;
  name: string;
  adult: number;
  child: number;
  time?: string | null;
  items?: DinnerItem["items"];
  memo?: string;
}): DinnerItem => {
  const now = new Date(2026, 0, 1, 12, 0, 0, 0);

  return {
    id: params.id,
    origin: params.origin ?? "dinner-system-front",
    dateKey: params.dateKey,
    status: params.status ?? "coming",
    dinner_customer_name: params.name,
    dinner_adult_count: params.adult,
    dinner_child_count: params.child,
    dinner_time: params.time ? dt(params.dateKey, params.time) : null,
    items: params.items,
    memo: params.memo ?? "",
    created_by: "dinner_front",
    created_at: now,
    updated_at: now,
  };
};

/**
 * 日付 → (id → DinnerItem)
 */
export const dummyDinnerByDate: DinnerByDate = {
  /* ======================
   * 2025-12（前月）
   * ====================== */
  "2025-12-28": {
    auto_900: item({
      id: "auto_900",
      dateKey: "2025-12-28",
      status: "coming",
      name: "年末 太郎",
      adult: 2,
      child: 0,
      time: "18:00",
    }),
  },
  "2025-12-30": {
    auto_901: item({
      id: "auto_901",
      origin: "ryokan-system-front",
      dateKey: "2025-12-30",
      status: "coming",
      name: "Year End Guest",
      adult: 1,
      child: 1,
      time: "19:00",
    }),
  },

  /* ======================
   * 2026-01（今月）
   * ====================== */
  "2026-01-10": {
    auto_001: item({
      id: "auto_001",
      dateKey: "2026-01-10",
      status: "coming",
      name: "山田 太郎",
      adult: 2,
      child: 0,
      time: "18:30",
      items: [
        { item_id: "wagyu_course", quantity: 1 },
        { item_id: "sake_pairing", quantity: 2 },
      ],
    }),
    auto_002: item({
      id: "auto_002",
      origin: "ryokan-system-front",
      dateKey: "2026-01-10",
      status: "coming",
      name: "John Smith",
      adult: 1,
      child: 1,
      time: "19:00",
      items: [{ item_id: "kids_course", quantity: 1 }],
    }),
  },
  "2026-01-11": {
    auto_003: item({
      id: "auto_003",
      origin: "ryokan-system-front",
      dateKey: "2026-01-11",
      status: "coming",
      name: "Chen Wei",
      adult: 2,
      child: 0,
      time: null, // 時間未確定
    }),
  },
  "2026-01-12": {
    auto_004: item({
      id: "auto_004",
      dateKey: "2026-01-12",
      status: "coming",
      name: "鈴木 一郎",
      adult: 1,
      child: 0,
      time: "18:00",
    }),
    auto_005: item({
      id: "auto_005",
      origin: "ryokan-system-front",
      dateKey: "2026-01-12",
      status: "coming",
      name: "Guest No Memo",
      adult: 2,
      child: 1,
      time: "18:30",
      items: [{ item_id: "wagyu_course", quantity: 2 }],
    }),
  },
  "2026-01-20": {
    auto_006a: item({
      id: "auto_006a",
      dateKey: "2026-01-20",
      status: "coming",
      name: "Late Jan Guest",
      adult: 3,
      child: 0,
      time: "19:30",
      items: [{ item_id: "veg_course", quantity: 1 }],
    }),
  },

  /* ======================
   * 2026-02（翌月）
   * ====================== */
  "2026-02-01": {
    auto_006: item({
      id: "auto_006",
      origin: "ryokan-system-front",
      dateKey: "2026-02-01",
      status: "coming",
      name: "Feb Guest",
      adult: 1,
      child: 0,
      time: "19:00",
    }),
  },
  "2026-02-05": {
    auto_007: item({
      id: "auto_007",
      dateKey: "2026-02-05",
      status: "coming",
      name: "Feb Family",
      adult: 2,
      child: 2,
      time: "18:30",
    }),
  },
  "2026-02-18": {
    auto_008: item({
      id: "auto_008",
      origin: "ryokan-system-front",
      dateKey: "2026-02-18",
      status: "coming",
      name: "No Time Guest",
      adult: 1,
      child: 0,
      time: null,
    }),
  },

  /* ======================
   * 2026-03（さらに翌月）
   * ====================== */
  "2026-03-03": {
    auto_009: item({
      id: "auto_009",
      dateKey: "2026-03-03",
      status: "coming",
      name: "March Guest",
      adult: 2,
      child: 0,
      time: "18:00",
    }),
  },
  "2026-03-15": {
    auto_010: item({
      id: "auto_010",
      origin: "ryokan-system-front",
      dateKey: "2026-03-15",
      status: "coming",
      name: "Spring Family",
      adult: 2,
      child: 1,
      time: "19:00",
    }),
  },
};
