"use client";

import { useMemo, useState } from "react";
import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import MonthSelector from "@/app/components/MonthSelector";
import { dummyDinnerDailySummaryByDate } from "@/app/data/dummyDinnerDailySummaryByDate";
import type { DinnerDailySummary } from "@/app/types/dinnerDailySummary";
import { parseDate } from "@/app/utils/dateUtils";

const DOW_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const;

const formatDayLabel = (dateStr: string) => {
  const date = parseDate(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekDay = DOW_LABELS[date.getDay()];
  return `${month}/${day} (${weekDay})`;
};

const toRows = (byDate: Record<string, DinnerDailySummary>) =>
  Object.values(byDate).sort((a, b) => a.dateKey.localeCompare(b.dateKey));

export default function AnalysisPage() {
  const currentYearMonth = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  }, []);
  const [yearMonth, setYearMonth] = useState<string>(currentYearMonth);
  const rows = useMemo(() => {
    const sorted = toRows(dummyDinnerDailySummaryByDate);
    if (!yearMonth) return sorted;
    return sorted.filter((row) => row.dateKey.startsWith(`${yearMonth}-`));
  }, [yearMonth]);
  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => ({
        total_sales: acc.total_sales + row.total_sales,
        total_groups: acc.total_groups + row.total_groups,
        total_guests: acc.total_guests + row.total_guests,
        canceled_groups: acc.canceled_groups + row.canceled_groups,
        canceled_guests: acc.canceled_guests + row.canceled_guests,
      }),
      {
        total_sales: 0,
        total_groups: 0,
        total_guests: 0,
        canceled_groups: 0,
        canceled_guests: 0,
      }
    );
  }, [rows]);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        日別サマリー
      </Typography>
      <MonthSelector yearMonth={yearMonth} onChange={setYearMonth} />
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table size="small" aria-label="daily summary table">
          <TableHead>
            <TableRow>
              <TableCell>日付</TableCell>
              <TableCell>売上</TableCell>
              <TableCell>組数</TableCell>
              <TableCell>人数</TableCell>
              <TableCell>キャンセル組</TableCell>
              <TableCell>キャンセル人数</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={`${row.store_id}-${row.dateKey}`}>
                <TableCell>{formatDayLabel(row.dateKey)}</TableCell>
                <TableCell>{row.total_sales.toLocaleString()}</TableCell>
                <TableCell>{row.total_groups}</TableCell>
                <TableCell>{row.total_guests}</TableCell>
                <TableCell>{row.canceled_groups}</TableCell>
                <TableCell>{row.canceled_guests}</TableCell>
              </TableRow>
            ))}
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography variant="body2" color="text.secondary">
                    データがありません。
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              <TableRow>
                <TableCell>
                  <Typography variant="subtitle2">合計</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2">{totals.total_sales.toLocaleString()}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2">{totals.total_groups}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2">{totals.total_guests}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2">{totals.canceled_groups}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2">{totals.canceled_guests}</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
