import type { StaffShiftByDate } from "@/app/types/dinner";

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

const now = new Date(2026, 0, 1, 12, 0, 0, 0);

export const dummyStaffShiftByDate: StaffShiftByDate = {
  "2026-01-10": [
    {
      id: "shift_001",
      store_id: "asakusa_001",
      dateKey: "2026-01-10",
      staff_id: "yamada",
      staff_name: "山田",
      start_time: dt("2026-01-10", "17:00"),
      end_time: dt("2026-01-10", "21:00"),
      breaks: [
        {
          start_time: dt("2026-01-10", "18:30"),
          end_time: dt("2026-01-10", "18:45"),
        },
      ],
      created_at: now,
      updated_at: now,
    },
    {
      id: "shift_002",
      store_id: "asakusa_001",
      dateKey: "2026-01-10",
      staff_id: "sato",
      staff_name: "佐藤",
      start_time: dt("2026-01-10", "17:00"),
      end_time: dt("2026-01-10", "19:30"),
      breaks: [],
      created_at: now,
      updated_at: now,
    },
  ],
  "2026-01-12": [
    {
      id: "shift_003",
      store_id: "asakusa_001",
      dateKey: "2026-01-12",
      staff_id: "tanaka",
      staff_name: "田中",
      start_time: dt("2026-01-12", "16:00"),
      end_time: dt("2026-01-12", "20:00"),
      breaks: [
        {
          start_time: dt("2026-01-12", "17:45"),
          end_time: dt("2026-01-12", "18:00"),
        },
      ],
      created_at: now,
      updated_at: now,
    },
  ],
};
