"use client";

import { useCallback, useEffect, useState } from "react";
import type { DinnerItem } from "@/app/types/dinner";

type ApiRyokanReservationRow = {
  id: string;
  reservation_number: string;
  origin: "ryokan-system-front";
  status: DinnerItem["status"] | "canceled";
  dinner_time_kind: "scheduled" | "pending" | "canceled_stay" | "canceled_dinner";
  dateKey: string;
  dinner_customer_name: string;
  dinner_adult_count: number;
  dinner_child_count: number;
  dinner_time: string | null;
  memo: string;
};

type ApiDinnerReservationRow = {
  id: string;
  origin: "dinner-system-front";
  status: DinnerItem["status"] | "canceled";
  dateKey: string;
  dinner_customer_name: string;
  dinner_adult_count: number;
  dinner_child_count: number;
  dinner_time: string | null;
  memo: string;
  created_by: "dinner_front";
  created_at: string;
  updated_at: string;
};

type ApiResponse<T> = {
  rows?: T[];
  errors?: string[];
};

const normalizeStatus = (status: string): DinnerItem["status"] | null => {
  if (status === "coming") return "coming";
  if (status === "done") return "done";
  if (status === "canceled_stay") return "canceled_stay";
  if (status === "canceled_dinner") return "canceled_dinner";
  if (status === "canceled") return "canceled_stay";
  return null;
};

const mergeRowsWithDuplicateCheck = (
  ryokanRows: DinnerItem[],
  localRows: DinnerItem[]
): { mergedRows: DinnerItem[]; duplicateErrors: string[] } => {
  const mergedRows = [...ryokanRows, ...localRows];
  const byId = new Map<string, Set<DinnerItem["origin"]>>();

  mergedRows.forEach((row) => {
    if (!byId.has(row.id)) byId.set(row.id, new Set());
    byId.get(row.id)!.add(row.origin);
  });

  const duplicateErrors: string[] = [];
  byId.forEach((origins, id) => {
    if (origins.size <= 1) return;
    duplicateErrors.push(`ID重複を検知: id=${id}（${[...origins].join(" / ")}）`);
  });

  return { mergedRows, duplicateErrors };
};

const mapRyokanRowToDinnerItem = (row: ApiRyokanReservationRow): DinnerItem | null => {
  const dinnerTime = row.dinner_time;
  if (dinnerTime !== null && !/^([01]\d|2[0-3]):([0-5]\d)$/.test(dinnerTime)) return null;
  const status = normalizeStatus(row.status);
  if (!status) return null;

  return {
    id: row.id,
    origin: row.origin,
    dateKey: row.dateKey,
    status,
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

const mapDinnerReservationRowToDinnerItem = (row: ApiDinnerReservationRow): DinnerItem | null => {
  const dinnerTime = row.dinner_time;
  if (dinnerTime !== null && !/^([01]\d|2[0-3]):([0-5]\d)$/.test(dinnerTime)) return null;
  const createdAt = new Date(row.created_at);
  const updatedAt = new Date(row.updated_at);
  if (Number.isNaN(createdAt.getTime()) || Number.isNaN(updatedAt.getTime())) return null;
  const status = normalizeStatus(row.status);
  if (!status) return null;

  return {
    id: row.id,
    origin: row.origin,
    dateKey: row.dateKey,
    status,
    dinner_customer_name: row.dinner_customer_name,
    dinner_adult_count: row.dinner_adult_count,
    dinner_child_count: row.dinner_child_count,
    dinner_time: dinnerTime,
    memo: row.memo,
    created_by: row.created_by,
    created_at: createdAt,
    updated_at: updatedAt,
  };
};

const sortDinnerRows = (items: DinnerItem[]) => {
  return [...items].sort((a, b) => {
    if (a.dateKey !== b.dateKey) return a.dateKey.localeCompare(b.dateKey);
    const at = a.dinner_time ?? "99:99";
    const bt = b.dinner_time ?? "99:99";
    if (at !== bt) return at.localeCompare(bt);
    return a.id.localeCompare(b.id);
  });
};

export function useDinnerDataByDate(dateKey: string): {
  rows: DinnerItem[];
  loading: boolean;
  errors: string[];
  refetch: () => void;
} {
  const [rows, setRows] = useState<DinnerItem[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = useCallback(() => {
    setReloadToken((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const fetchRows = async () => {
      setLoading(true);
      try {
        const [ryokanRes, dinnerRes] = await Promise.all([
          fetch(`/api/reservations?dateKey=${encodeURIComponent(dateKey)}`, {
            method: "GET",
            cache: "no-store",
          }),
          fetch(`/api/dinner-reservations?dateKey=${encodeURIComponent(dateKey)}`, {
            method: "GET",
            cache: "no-store",
          }),
        ]);

        const ryokanPayload = (await ryokanRes.json()) as ApiResponse<ApiRyokanReservationRow>;
        const dinnerPayload = (await dinnerRes.json()) as ApiResponse<ApiDinnerReservationRow>;

        const collectedErrors: string[] = [];

        if (!ryokanRes.ok) {
          const apiErrors = Array.isArray(ryokanPayload.errors)
            ? ryokanPayload.errors
            : ["Ryokan API request failed."];
          collectedErrors.push(...apiErrors);
        }

        if (!dinnerRes.ok) {
          const apiErrors = Array.isArray(dinnerPayload.errors)
            ? dinnerPayload.errors
            : ["Dinner reservation API request failed."];
          collectedErrors.push(...apiErrors);
        }

        const ryokanRows = Array.isArray(ryokanPayload.rows)
          ? ryokanPayload.rows
              .map(mapRyokanRowToDinnerItem)
              .filter((row): row is DinnerItem => row !== null)
          : [];

        const localRows = Array.isArray(dinnerPayload.rows)
          ? dinnerPayload.rows
              .map(mapDinnerReservationRowToDinnerItem)
              .filter((row): row is DinnerItem => row !== null)
          : [];

        const apiErrors = [
          ...(Array.isArray(ryokanPayload.errors) ? ryokanPayload.errors : []),
          ...(Array.isArray(dinnerPayload.errors) ? dinnerPayload.errors : []),
          ...collectedErrors,
        ];

        const { mergedRows, duplicateErrors } = mergeRowsWithDuplicateCheck(ryokanRows, localRows);

        if (!isCancelled) {
          setRows(sortDinnerRows(mergedRows));
          setErrors([...apiErrors, ...duplicateErrors]);
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
  }, [dateKey, reloadToken]);

  return { rows, loading, errors, refetch };
}
