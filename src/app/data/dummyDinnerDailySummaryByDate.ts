import type { DinnerDailySummary } from "@/app/types/dinnerDailySummary";

export const dummyDinnerDailySummaryByDate: Record<string, DinnerDailySummary> = {
  "2026-01-10": {
    store_id: "asakusa_001",
    dateKey: "2026-01-10",
    total_sales: 48000,
    total_groups: 2,
    total_guests: 4,
    canceled_groups: 0,
    canceled_guests: 0,
    memo: "週末で混雑",
  },
  "2026-01-11": {
    store_id: "asakusa_001",
    dateKey: "2026-01-11",
    total_sales: 18000,
    total_groups: 1,
    total_guests: 2,
    canceled_groups: 0,
    canceled_guests: 0,
  },
  "2026-01-12": {
    store_id: "asakusa_001",
    dateKey: "2026-01-12",
    total_sales: 36000,
    total_groups: 2,
    total_guests: 4,
    canceled_groups: 1,
    canceled_guests: 1,
    memo: "雨天で一部キャンセル",
  },
  "2026-01-20": {
    store_id: "asakusa_001",
    dateKey: "2026-01-20",
    total_sales: 42000,
    total_groups: 1,
    total_guests: 3,
    canceled_groups: 0,
    canceled_guests: 0,
  },
};
