"use client";

import { useMemo, useState } from "react";
import {
  Box,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import MonthSelector from "@/app/ATaxTable/MonthSelector";
import { useDinnerDataByMonth } from "@/app/hooks/useDinnerDataByMonth";
import type { DinnerItem } from "@/app/types/dinner";
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

const resolveDinnerTimeLabel = (row: DinnerItem) => {
  const value = row.dinner_time;
  if (!value) return "未定";
  const hour = String(value.getHours()).padStart(2, "0");
  const minute = String(value.getMinutes()).padStart(2, "0");
  return `${hour}:${minute}`;
};

const DinnerPage = () => {
  const currentYearMonth = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  }, []);
  const [yearMonth, setYearMonth] = useState<string>(currentYearMonth);
  const { rows, loading } = useDinnerDataByMonth(yearMonth);

  const dinnerRows = rows;

  const dinnerByDate = useMemo(() => {
    const grouped = new Map<string, DinnerItem[]>();
    dinnerRows.forEach((row) => {
      const key = row.dateKey || "日付未設定";
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
      <MonthSelector yearMonth={yearMonth} onChange={setYearMonth} />
      {loading ? (
        <Stack alignItems="center" sx={{ py: 6 }}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            予約を読み込み中です…
          </Typography>
        </Stack>
      ) : dinnerByDate.length === 0 ? (
        <Typography color="text.secondary">
          dinner=1 の予約はありません。（{yearMonth || "全月"}）
        </Typography>
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
                  <Typography variant="subtitle2">{row.dinner_customer_name || "-"}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    adult: {row.dinner_adult_count ?? 0} / child: {row.dinner_child_count ?? 0}
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
                    defaultValue={row.memo}
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
