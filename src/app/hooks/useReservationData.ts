"use client";

import { useMemo } from "react";
import { dummyReservationRows } from "@/app/data/dummyReservationRows";
import type { ReservationRow } from "@/app/types/reservation";

export function useReservationData(): { rows: ReservationRow[]; loading: boolean } {
  const rows = useMemo(() => dummyReservationRows, []);
  return { rows, loading: false };
}

