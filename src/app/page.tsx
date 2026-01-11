"use client";

import { useMemo, useState } from "react";
import {
  Box,
  IconButton,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import MonthSelector from "@/app/components/MonthSelector";
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

type UiStatus = "coming" | "canceled";

const STATUS_LABEL: Record<UiStatus, string> = {
  coming: "coming",
  canceled: "canceled",
};

const STATUS_COLOR: Record<UiStatus, "success" | "default"> = {
  coming: "success",
  canceled: "default",
};

const createLocalId = () => {
  const cryptoObj = globalThis.crypto;
  if (cryptoObj?.randomUUID) return cryptoObj.randomUUID();
  const bytes = new Uint8Array(16);
  cryptoObj?.getRandomValues?.(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
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

  const [createdItems, setCreatedItems] = useState<DinnerItem[]>([]);
  const [overrides, setOverrides] = useState<Record<string, Partial<DinnerItem>>>({});

  const dinnerRows = useMemo(() => {
    const visibleCreated = yearMonth
      ? createdItems.filter((row) => row.dateKey.startsWith(`${yearMonth}-`))
      : createdItems;
    return [...rows, ...visibleCreated].map((row) => ({ ...row, ...(overrides[row.id] ?? {}) }));
  }, [rows, createdItems, overrides, yearMonth]);

  const dinnerByDate = useMemo(() => {
    const grouped = new Map<string, DinnerItem[]>();
    dinnerRows.forEach((row) => {
      const key = row.dateKey || "日付未設定";
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(row);
    });
    return grouped;
  }, [dinnerRows]);

  const allDateKeysInMonth = useMemo(() => {
    if (!yearMonth) return [] as string[];
    const [yearStr, monthStr] = yearMonth.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr); // 1-12
    if (!Number.isFinite(year) || !Number.isFinite(month)) return [] as string[];
    const daysInMonth = new Date(year, month, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = String(i + 1).padStart(2, "0");
      return `${yearStr}-${monthStr}-${day}`;
    });
  }, [yearMonth]);

  const addEmptyReservation = (dateKey: string) => {
    const id = createLocalId();
    const now = new Date();
    const created: DinnerItem = {
      id,
      dateKey,
      status: "coming",
      dinner_customer_name: "name",
      dinner_adult_count: 0,
      dinner_child_count: 0,
      dinner_time: null,
      memo: "",
      created_by: "dinner_front",
      created_at: now,
      updated_at: now,
    };
    setCreatedItems((prev) => [...prev, created]);
  };

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
      ) : yearMonth && allDateKeysInMonth.length === 0 ? (
        <Typography color="text.secondary">表示月が不正です。</Typography>
      ) : !yearMonth ? (
        <Typography color="text.secondary">
          月未選択（全月表示）は未対応です。
        </Typography>
      ) : (
        allDateKeysInMonth.map((dateKey) => {
          const dayRows = dinnerByDate.get(dateKey) ?? [];
          const sorted = [...dayRows].sort((a, b) => {
            const at = a.dinner_time?.getTime() ?? Number.POSITIVE_INFINITY;
            const bt = b.dinner_time?.getTime() ?? Number.POSITIVE_INFINITY;
            return at - bt;
          });
          return (
          <Paper key={dateKey} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
              <Typography variant="h6">{formatDayLabel(dateKey)}</Typography>
              <IconButton aria-label="追加" onClick={() => addEmptyReservation(dateKey)} size="small">
                <AddIcon fontSize="small" />
              </IconButton>
            </Stack>
            <Box
              sx={{
                mt: 1.5,
                display: "flex",
                flexWrap: "wrap",
                gap: 1.5,
                alignItems: "stretch",
              }}
            >
              {sorted.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  予約なし
                </Typography>
              ) : null}
              {sorted.map((row) => (
                <Paper
                  key={row.id}
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    width: { xs: "100%", sm: "20%" },
                    flex: { xs: "1 1 100%", sm: "0 0 20%" },
                  }}
                >
                  <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                    <Typography variant="subtitle2" sx={{ minWidth: 0 }}>
                      {row.dinner_customer_name || "-"}
                    </Typography>
                    <StatusChip
                      status={row.status}
                      onToggle={(nextStatus) => {
                        setOverrides((prev) => ({
                          ...prev,
                          [row.id]: {
                            ...(prev[row.id] ?? {}),
                            status: nextStatus,
                            updated_at: new Date(),
                          },
                        }));
                      }}
                    />
                  </Stack>
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
          );
        })
      )}
    </Box>
  );
};

function StatusChip({
  status,
  onToggle,
}: {
  status: DinnerItem["status"];
  onToggle: (next: DinnerItem["status"]) => void;
}) {
  const uiStatus: UiStatus = status === "canceled" ? "canceled" : "coming";

  return (
    <Chip
      label={STATUS_LABEL[uiStatus]}
      color={STATUS_COLOR[uiStatus]}
      size="small"
      clickable
      onClick={() => onToggle(uiStatus === "coming" ? "canceled" : "coming")}
      sx={{ flexShrink: 0 }}
    />
  );
}
