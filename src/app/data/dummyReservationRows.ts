import type { ReservationRow } from "@/app/types/reservation";

export const dummyReservationRows: ReservationRow[] = [
  {
    id: "rsv_001",
    guest_name: "山田 太郎",
    adult_count: 2,
    child_count: 0,
    dinner: 1,
    dinner_time: "18:30",
    check_in_date: "2026-01-10",
  },
  {
    id: "rsv_002",
    guest_name: "John Smith",
    adult_count: 1,
    child_count: 1,
    dinner: 1,
    dinner_time: ["19:00", null],
    check_in_date: "2026-01-10",
  },
  {
    id: "rsv_003",
    guest_name: "佐藤 花子",
    adult_count: 2,
    child_count: 2,
    dinner: 0,
    dinner_time: "18:00",
    check_in_date: "2026-01-10",
  },
  {
    id: "rsv_004",
    guest_name: "Chen Wei",
    adult_count: 2,
    child_count: 0,
    dinner: 1,
    dinner_time: null,
    check_in_date: "2026-01-11",
  },
  {
    id: "rsv_005",
    guest_name: "鈴木 一郎",
    adult_count: 1,
    child_count: 0,
    dinner: 1,
    dinner_time: ["18:00", "18:30"],
    check_in_date: "2026-01-12",
  },
  {
    id: "rsv_006",
    guest_name: "Guest No Date",
    adult_count: 2,
    child_count: 1,
    dinner: 1,
    dinner_time: "19:00",
    check_in_date: null,
  },
];

