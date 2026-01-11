"use client";

import { useMemo } from "react";
import { dummyDinnerByDate } from "@/app/data/dummyDinnerByDate";
import type { DinnerItem } from "@/app/types/dinner";

export function useDinnerDataByMonth(yearMonth: string): { rows: DinnerItem[]; loading: boolean } {
  const rows = useMemo(() => {
    const dateKeys = Object.keys(dummyDinnerByDate);
    const filteredKeys = yearMonth
      ? dateKeys.filter((key) => key.startsWith(`${yearMonth}-`))
      : dateKeys;

    const flattened: DinnerItem[] = [];
    filteredKeys.forEach((dateKey) => {
      const byId = dummyDinnerByDate[dateKey];
      Object.values(byId).forEach((row) => flattened.push(row));
    });

    flattened.sort((a, b) => {
      if (a.dateKey !== b.dateKey) return a.dateKey.localeCompare(b.dateKey);
      const at = a.dinner_time?.getTime() ?? Number.POSITIVE_INFINITY;
      const bt = b.dinner_time?.getTime() ?? Number.POSITIVE_INFINITY;
      return at - bt;
    });

    return flattened;
  }, [yearMonth]);

  return { rows, loading: false };
}

