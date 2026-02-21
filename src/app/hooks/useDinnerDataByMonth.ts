"use client";

import { useEffect, useState } from "react";
import type { DinnerItem } from "@/app/types/dinner";

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

type ApiResponse = {
  rows?: ApiReservationRow[];
  errors?: string[];
};

const mapApiRowToDinnerItem = (row: ApiReservationRow): DinnerItem | null => {
  const dinnerTime = new Date(row.dinner_time);
  if (Number.isNaN(dinnerTime.getTime())) return null;

  return {
    id: row.id,
    origin: row.origin,
    dateKey: row.dateKey,
    status: row.status,
    dinner_customer_name: row.dinner_customer_name,
    dinner_adult_count: row.dinner_adult_count,
    dinner_child_count: row.dinner_child_count,
    dinner_time: dinnerTime,
    memo: row.memo,
    created_by: "gmail-listener_back",
    created_at: new Date(),
    updated_at: new Date(),
  };
};

export function useDinnerDataByMonth(yearMonth: string): {
  rows: DinnerItem[];
  loading: boolean;
  errors: string[];
} {
  const [rows, setRows] = useState<DinnerItem[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isCancelled = false;

    const fetchRows = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/reservations?yearMonth=${encodeURIComponent(yearMonth)}`, {
          method: "GET",
          cache: "no-store",
        });

        const payload = (await response.json()) as ApiResponse;
        if (!response.ok) {
          const apiErrors = Array.isArray(payload.errors) ? payload.errors : ["API request failed."];
          if (!isCancelled) {
            setRows([]);
            setErrors(apiErrors);
          }
          return;
        }

        const mappedRows = Array.isArray(payload.rows)
          ? payload.rows
              .map(mapApiRowToDinnerItem)
              .filter((row): row is DinnerItem => row !== null)
          : [];

        const apiErrors = Array.isArray(payload.errors) ? payload.errors : [];
        if (!isCancelled) {
          setRows(mappedRows);
          setErrors(apiErrors);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        if (!isCancelled) {
          setRows([]);
          setErrors([`Failed to fetch reservations: ${message}`]);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    void fetchRows();

    return () => {
      isCancelled = true;
    };
  }, [yearMonth]);

  return { rows, loading, errors };
}
