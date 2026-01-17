"use client";

import { useMemo } from "react";
import { dummyDinnerByDate } from "@/app/data/dummyDinnerByDate";
import { dummyStaffShiftByDate } from "@/app/data/dummyStaffShiftByDate";
import type { DinnerItem, StaffShift } from "@/app/types/dinner";

export function useDinnerDataByMonth(yearMonth: string): {
  rows: DinnerItem[];
  shiftsByDate: Record<string, StaffShift[]>;
  loading: boolean;
} {
  const { rows, shiftsByDate } = useMemo(() => {
    const dateKeys = Object.keys(dummyDinnerByDate);
    const filteredKeys = yearMonth
      ? dateKeys.filter((key) => key.startsWith(`${yearMonth}-`))
      : dateKeys;

    const flattened: DinnerItem[] = [];
    const shiftMap: Record<string, StaffShift[]> = {};
    filteredKeys.forEach((dateKey) => {
      const byId = dummyDinnerByDate[dateKey];
      shiftMap[dateKey] = dummyStaffShiftByDate[dateKey] ?? [];
      Object.values(byId).forEach((row) => flattened.push(row));
    });

    flattened.sort((a, b) => {
      if (a.dateKey !== b.dateKey) return a.dateKey.localeCompare(b.dateKey);
      const at = a.dinner_time?.getTime() ?? Number.POSITIVE_INFINITY;
      const bt = b.dinner_time?.getTime() ?? Number.POSITIVE_INFINITY;
      return at - bt;
    });

    return { rows: flattened, shiftsByDate: shiftMap };
  }, [yearMonth]);

  return { rows, shiftsByDate, loading: false };
}
