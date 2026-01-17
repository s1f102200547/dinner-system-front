"use client";

import { Box, Typography } from "@mui/material";
import { useSearchParams } from "next/navigation";
import { dummyDinnerByDate } from "@/app/data/dummyDinnerByDate";

const findReservationName = (reservationId: string | undefined) => {
  if (!reservationId) return null;
  const dateKeys = Object.keys(dummyDinnerByDate);
  for (const dateKey of dateKeys) {
    const byId = dummyDinnerByDate[dateKey];
    const row = byId[reservationId];
    if (row) return row.dinner_customer_name;
  }
  return null;
};

export default function GuestFormPage() {
  const searchParams = useSearchParams();
  const reservationId = searchParams.get("reservationId") ?? undefined;
  const name = findReservationName(reservationId);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        ゲストフォーム
      </Typography>
      {name ? (
        <Typography variant="body1">{name}</Typography>
      ) : (
        <Typography variant="body2" color="text.secondary">
          予約が見つかりません。
        </Typography>
      )}
    </Box>
  );
}
