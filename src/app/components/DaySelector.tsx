"use client";

import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { IconButton, Paper, Stack, TextField, Typography } from "@mui/material";

type Props = {
  dateKey: string; // YYYY-MM-DD
  onChange: (next: string) => void;
};

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const shiftDate = (dateKey: string, deltaDays: number) => {
  if (!DATE_KEY_PATTERN.test(dateKey)) return dateKey;
  const [yearStr, monthStr, dayStr] = dateKey.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const next = new Date(year, month - 1, day + deltaDays);
  const y = String(next.getFullYear());
  const m = String(next.getMonth() + 1).padStart(2, "0");
  const d = String(next.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export default function DaySelector({ dateKey, onChange }: Props) {
  const label = (() => {
    if (!DATE_KEY_PATTERN.test(dateKey)) return "日付未設定";
    const [yearStr, monthStr, dayStr] = dateKey.split("-");
    return `${yearStr}/${monthStr}/${dayStr}`;
  })();

  return (
    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, mb: 2 }}>
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
        <IconButton aria-label="前日" onClick={() => onChange(shiftDate(dateKey, -1))} size="small">
          <ArrowBackIosIcon fontSize="small" />
        </IconButton>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ flex: 1 }}>
          <Typography variant="subtitle1">{label}</Typography>
          <TextField
            size="small"
            type="date"
            value={dateKey}
            onChange={(event) => onChange(event.target.value)}
            inputProps={{ "aria-label": "表示日" }}
          />
        </Stack>
        <IconButton aria-label="翌日" onClick={() => onChange(shiftDate(dateKey, 1))} size="small">
          <ArrowForwardIosIcon fontSize="small" />
        </IconButton>
      </Stack>
    </Paper>
  );
}
