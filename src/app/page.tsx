"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  IconButton,
  CircularProgress,
  Paper,
  Alert,
  Chip,
  Stack,
  TextField,
  Typography,
  Button,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
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

const toTimeLabel = (value: Date | null) => {
  if (!value) return "未定";
  const hour = String(value.getHours()).padStart(2, "0");
  const minute = String(value.getMinutes()).padStart(2, "0");
  return `${hour}:${minute}`;
};

const toTimeValue = (value: Date | null) => {
  if (!value) return "";
  const hour = String(value.getHours()).padStart(2, "0");
  const minute = String(value.getMinutes()).padStart(2, "0");
  return `${hour}:${minute}`;
};

const toDateFromTime = (dateKey: string, hhmm: string) => {
  if (!hhmm) return null;
  const [yearStr, monthStr, dayStr] = dateKey.split("-");
  const [hourStr, minuteStr] = hhmm.split(":");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  if (![year, month, day, hour, minute].every((v) => Number.isFinite(v))) return null;
  return new Date(year, month - 1, day, hour, minute, 0, 0);
};

const compactTextFieldSx = {
  "& .MuiInputBase-root": {
    height: 32,
    fontSize: 13,
  },
  "& .MuiInputBase-input": {
    py: 0.5,
  },
};

const compactMultilineSx = {
  "& .MuiInputBase-root": {
    fontSize: 13,
  },
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
  const { rows, loading, errors } = useDinnerDataByMonth(yearMonth);

  const [createdItems, setCreatedItems] = useState<DinnerItem[]>([]);
  const [overrides, setOverrides] = useState<Record<string, Partial<DinnerItem>>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<Partial<DinnerItem> | null>(null);
  const editingCardRef = useRef<HTMLDivElement | null>(null);
  const isEditable = (row: DinnerItem) => row.origin === "dinner-system-front";

  const cancelEdit = () => {
    setEditingId(null);
    setEditingDraft(null);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!editingId) return;
      const target = event.target as Node | null;
      if (!target) return;
      if (editingCardRef.current?.contains(target)) return;
      if (target instanceof Element) {
        if (target.closest(".MuiPopover-root, .MuiModal-root, .MuiMenu-paper")) return;
      }
      cancelEdit();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [editingId]);

  const updateRow = (id: string, patch: Partial<DinnerItem>) => {
    setOverrides((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] ?? {}),
        ...patch,
        updated_at: new Date(),
      },
    }));
  };

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
    const month = Number(monthStr);
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
      origin: "dinner-system-front",
      dateKey,
      status: "coming",
      dinner_customer_name: "name",
      dinner_adult_count: 0,
      dinner_child_count: 0,
      dinner_time: null,
      items: [],
      memo: "",
      created_by: "dinner_front",
      created_at: now,
      updated_at: now,
    };
    setCreatedItems((prev) => [...prev, created]);
  };

  const beginEdit = (row: DinnerItem) => {
    if (!isEditable(row)) return;
    setEditingId(row.id);
    setEditingDraft({
      dinner_customer_name: row.dinner_customer_name,
      dinner_adult_count: row.dinner_adult_count,
      dinner_child_count: row.dinner_child_count,
      dinner_time: row.dinner_time,
      memo: row.memo,
    });
  };

  const saveEdit = (rowId: string) => {
    if (!editingDraft) return;
    const target = dinnerRows.find((row) => row.id === rowId);
    if (!target || !isEditable(target)) return;
    updateRow(rowId, editingDraft);
    cancelEdit();
  };

  return (
    <Box sx={{ p: 2 }}>
      {errors.length > 0 ? (
        <Stack spacing={1} sx={{ mb: 2 }}>
          {errors.map((message, index) => (
            <Alert key={`${message}-${index}`} severity="error">
              {message}
            </Alert>
          ))}
        </Stack>
      ) : null}
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
        <Typography color="text.secondary">月未選択（全月表示）は未対応です。</Typography>
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
                      width: { xs: "100%", sm: "24%" },
                      flex: { xs: "1 1 100%", sm: "0 0 24%" },
                    }}
                    ref={editingId === row.id ? editingCardRef : null}
                  >
                    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                      {editingId === row.id ? null : (
                        <>
                          <Typography variant="subtitle2" sx={{ minWidth: 0 }}>
                            {row.dinner_customer_name || "-"}
                          </Typography>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            {row.status === "canceled" ? (
                              <Chip
                                size="small"
                                label="キャンセル"
                                color="error"
                                variant="outlined"
                                sx={{ height: 20 }}
                              />
                            ) : null}
                            <IconButton
                              aria-label="編集"
                              size="small"
                              onClick={() => beginEdit(row)}
                              disabled={!isEditable(row) || (editingId !== null && editingId !== row.id)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </>
                      )}
                    </Stack>
                    {editingId === row.id ? (
                      <>
                        <TextField
                          label="name"
                          size="small"
                          fullWidth
                          value={editingDraft?.dinner_customer_name ?? ""}
                          onChange={(e) =>
                            setEditingDraft((prev) => ({
                              ...(prev ?? {}),
                              dinner_customer_name: e.target.value,
                            }))
                          }
                          sx={{ mt: 1, ...compactTextFieldSx }}
                        />
                        <TextField
                          label="time"
                          type="time"
                          size="small"
                          value={toTimeValue(editingDraft?.dinner_time ?? null)}
                          onChange={(e) =>
                            setEditingDraft((prev) => ({
                              ...(prev ?? {}),
                              dinner_time: toDateFromTime(row.dateKey, e.target.value),
                            }))
                          }
                          InputLabelProps={{ shrink: true }}
                          sx={{ mt: 1, ...compactTextFieldSx }}
                        />
                        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                          <TextField
                            label="adult"
                            type="number"
                            size="small"
                            value={editingDraft?.dinner_adult_count ?? 0}
                            onChange={(e) => {
                              const next = Number(e.target.value);
                              setEditingDraft((prev) => ({
                                ...(prev ?? {}),
                                dinner_adult_count: Number.isFinite(next) ? next : 0,
                              }));
                            }}
                            inputProps={{ min: 0, max: 99 }}
                            sx={{ flex: 1, ...compactTextFieldSx }}
                          />
                          <TextField
                            label="child"
                            type="number"
                            size="small"
                            value={editingDraft?.dinner_child_count ?? 0}
                            onChange={(e) => {
                              const next = Number(e.target.value);
                              setEditingDraft((prev) => ({
                                ...(prev ?? {}),
                                dinner_child_count: Number.isFinite(next) ? next : 0,
                              }));
                            }}
                            inputProps={{ min: 0, max: 99 }}
                            sx={{ flex: 1, ...compactTextFieldSx }}
                          />
                        </Stack>
                        <TextField
                          label="memo"
                          placeholder="保存されません"
                          size="small"
                          fullWidth
                          multiline
                          minRows={2}
                          sx={{ mt: 1, ...compactMultilineSx }}
                          value={editingDraft?.memo ?? ""}
                          onChange={(e) =>
                            setEditingDraft((prev) => ({
                              ...(prev ?? {}),
                              memo: e.target.value,
                            }))
                          }
                        />
                        <Stack direction="row" spacing={1} sx={{ mt: 1, justifyContent: "flex-end" }}>
                          <Button size="small" onClick={cancelEdit}>
                            キャンセル
                          </Button>
                          <Button size="small" variant="contained" onClick={() => saveEdit(row.id)}>
                            保存
                          </Button>
                        </Stack>
                      </>
                    ) : (
                      <>
                        <Typography variant="body2" color="text.secondary">
                          adult: {row.dinner_adult_count ?? 0} child: {row.dinner_child_count ?? 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          time: {toTimeLabel(row.dinner_time)}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 1, whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                        >
                          {row.memo || "-"}
                        </Typography>
                      </>
                    )}
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
