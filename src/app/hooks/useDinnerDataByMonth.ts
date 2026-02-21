"use client";

import { useMemo } from "react";
import { dummyGuestInfoV2ByReservationNumber } from "@/app/data/dummyDinnerByDate";
import type { DinnerItem } from "@/app/types/dinner";

const parseSlashDate = (value: string) => {
  const [yearStr, monthStr, dayStr] = value.split("/");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (![year, month, day].every((n) => Number.isFinite(n))) return null;
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toDateTime = (date: Date, hhmm: string) => {
  const [hourStr, minuteStr] = hhmm.split(":");
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  if (![hour, minute].every((n) => Number.isFinite(n))) return null;
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hour,
    minute,
    0,
    0
  );
};

export function useDinnerDataByMonth(yearMonth: string): {
  rows: DinnerItem[];
  loading: boolean;
  errors: string[];
} {
  const { rows, errors } = useMemo(() => {
    const flattened: DinnerItem[] = [];
    const validationErrors: string[] = [];

    Object.entries(dummyGuestInfoV2ByReservationNumber).forEach(([reservationNumber, reservation]) => {
      if (reservation.dinner !== 1) return;
      if (reservation.cancel === 1) return;

      const checkIn = parseSlashDate(reservation.check_in_date);
      const checkOut = parseSlashDate(reservation.check_out_date);
      if (!checkIn || !checkOut || checkOut <= checkIn) {
        validationErrors.push(`予約 ${reservationNumber}: 日付が不正なため除外しました。`);
        return;
      }

      const nights = Math.floor((checkOut.getTime() - checkIn.getTime()) / (24 * 60 * 60 * 1000));
      if (reservation.dinner_time.length !== nights) {
        validationErrors.push(
          `予約 ${reservationNumber}: dinner_time の件数(${reservation.dinner_time.length})と泊数(${nights})が不一致のため除外しました。`
        );
        return;
      }

      for (let i = 0; i < nights; i += 1) {
        const stayDate = new Date(checkIn);
        stayDate.setDate(checkIn.getDate() + i);
        const dateKey = toDateKey(stayDate);
        if (!dateKey.startsWith(`${yearMonth}-`)) continue;

        const timeText = reservation.dinner_time[i];
        if (timeText === null) continue;

        const dinnerTime = toDateTime(stayDate, timeText);
        if (!dinnerTime) continue;

        flattened.push({
          id: reservationNumber,
          origin: "ryokan-system-front",
          dateKey,
          status: "coming",
          dinner_customer_name: reservation.guest_name,
          dinner_adult_count: reservation.adult_count,
          dinner_child_count: reservation.child_count,
          dinner_time: dinnerTime,
          memo: "",
          created_by: "gmail-listener_back",
          created_at: new Date(),
          updated_at: new Date(),
        });
      }
    });

    flattened.sort((a, b) => {
      if (a.dateKey !== b.dateKey) return a.dateKey.localeCompare(b.dateKey);
      const at = a.dinner_time?.getTime() ?? Number.POSITIVE_INFINITY;
      const bt = b.dinner_time?.getTime() ?? Number.POSITIVE_INFINITY;
      if (at !== bt) return at - bt;
      return a.id.localeCompare(b.id);
    });

    return { rows: flattened, errors: validationErrors };
  }, [yearMonth]);

  return { rows, loading: false, errors };
}
