"use client";

import { useMemo } from "react";
import {
  Box,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useReservationData } from "@/app/hooks/useReservationData";
import type { ReservationRow } from "@/app/types/reservation";
import { parseDate } from "@/app/utils/dateUtils";

export default function Home() {
  return <DinnerPage />;
}

const DOW_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const;

const formatDayLabel = (dateStr: string | null | undefined) => {
  if (!dateStr) return "日付未設定";
  const date = parseDate(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekDay = DOW_LABELS[date.getDay()];
  return `${month}/${day} (${weekDay})`;
};

const resolveDinnerTimeLabel = (row: ReservationRow) => {
  const value = row.dinner_time;
  if (Array.isArray(value)) {
    const first = value.find((v) => v !== null && v !== undefined && v !== "");
    return first || "未定";
  }
  return value || "未定";
};

const DinnerPage = () => {
  const { rows, loading } = useReservationData();

  const dinnerRows = useMemo(
    () => rows.filter((row) => Number(row.dinner ?? 0) === 1),
    [rows],
  );

  const dinnerByDate = useMemo(() => {
    const grouped = new Map<string, ReservationRow[]>();
    dinnerRows.forEach((row) => {
      const key = row.check_in_date || "日付未設定";
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(row);
    });
    return [...grouped.entries()].sort(([a], [b]) => {
      if (a === "日付未設定") return 1;
      if (b === "日付未設定") return -1;
      return parseDate(a).getTime() - parseDate(b).getTime();
    });
  }, [dinnerRows]);

  return (
    <Box sx={{ p: 2 }}>
      {loading ? (
        <Stack alignItems="center" sx={{ py: 6 }}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            予約を読み込み中です…
          </Typography>
        </Stack>
      ) : dinnerByDate.length === 0 ? (
        <Typography color="text.secondary">dinner=1 の予約はありません。</Typography>
      ) : (
        dinnerByDate.map(([dateKey, dayRows]) => (
          <Paper key={dateKey} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
            <Typography variant="h6">{formatDayLabel(dateKey)}</Typography>
            <Box
              sx={{
                mt: 1.5,
                display: "flex",
                flexWrap: "wrap",
                gap: 1.5,
                alignItems: "stretch",
              }}
            >
              {dayRows.map((row) => (
                <Paper
                  key={row.id}
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    width: { xs: "100%", sm: "20%" },
                    flex: { xs: "1 1 100%", sm: "0 0 20%" },
                  }}
                >
                  <Typography variant="subtitle2">{row.guest_name || "-"}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    adult: {row.adult_count ?? 0} / child: {row.child_count ?? 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    dinner: {resolveDinnerTimeLabel(row)}
                  </Typography>
                  <TextField
                    label="memo"
                    placeholder="保存されません"
                    size="small"
                    fullWidth
                    multiline
                    minRows={2}
                    sx={{ mt: 1 }}
                  />
                </Paper>
              ))}
            </Box>
          </Paper>
        ))
      )}
    </Box>
  );
};
