"use client";

import { useMemo } from "react";
import { dummyReservationRows } from "@/app/data/dummyReservationRows";
import type { ReservationRow } from "@/app/types/reservation";

export function useReservationDataByMonth(yearMonth: string): {
  rows: ReservationRow[];
  loading: boolean;
} {
  const rows = useMemo(() => {
    if (!yearMonth) return dummyReservationRows;
    const prefix = `${yearMonth}-`;
    return dummyReservationRows.filter((row) => (row.check_in_date ?? "").startsWith(prefix));
  }, [yearMonth]);

  return { rows, loading: false };
}
