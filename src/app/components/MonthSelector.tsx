"use client";

import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { IconButton, Paper, Stack, Typography } from "@mui/material";

type Props = {
  yearMonth: string; // YYYY-MM or empty
  onChange: (next: string) => void;
};

export default function MonthSelector({ yearMonth, onChange }: Props) {
  const currentYearMonth = (() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  })();

  const monthLabel = (() => {
    if (!yearMonth) return "全月";
    const month = Number(yearMonth.split("-")[1] ?? NaN);
    if (!Number.isFinite(month)) return "全月";
    return `${month}月`;
  })();

  const shiftMonth = (delta: number) => {
    const base = yearMonth || currentYearMonth;
    const [yearStr, monthStr] = base.split("-");
    const year = Number(yearStr);
    const monthIndex = Number(monthStr) - 1; // 0-based
    const next = new Date(year, monthIndex + delta, 1);
    const nextYear = next.getFullYear();
    const nextMonth = String(next.getMonth() + 1).padStart(2, "0");
    onChange(`${nextYear}-${nextMonth}`);
  };

  return (
    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, mb: 2 }}>
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
        <IconButton aria-label="前の月" onClick={() => shiftMonth(-1)} size="small">
          <ArrowBackIosIcon fontSize="small" />
        </IconButton>
        <Typography sx={{ flex: 1, textAlign: "center" }} variant="subtitle1">
          {monthLabel}
        </Typography>
        <IconButton aria-label="次の月" onClick={() => shiftMonth(1)} size="small">
          <ArrowForwardIosIcon fontSize="small" />
        </IconButton>
      </Stack>
    </Paper>
  );
}

