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
  FormControlLabel,
  Switch,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import { useRouter } from "next/navigation";
import DaySelector from "@/app/components/DaySelector";
import { useDinnerDataByDate } from "@/app/hooks/useDinnerDataByMonth";
import type { DinnerItem } from "@/app/types/dinner";
import { parseDate } from "@/app/utils/dateUtils";

export default function Home() {
  return <HomeAuthGate />;
}

const HomeAuthGate = () => {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let canceled = false;
    const run = async () => {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (canceled) return;
        if (!response.ok) {
          router.replace("/login?next=%2F");
          return;
        }
        setIsAuthenticated(true);
      } catch {
        if (!canceled) {
          router.replace("/login?next=%2F");
        }
      } finally {
        if (!canceled) {
          setIsCheckingAuth(false);
        }
      }
    };
    void run();
    return () => {
      canceled = true;
    };
  }, [router]);

  if (isCheckingAuth || !isAuthenticated) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ minHeight: "100vh" }}>
        <CircularProgress />
      </Stack>
    );
  }

  return <DinnerPage />;
};

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

const DinnerPage = () => {
  const currentDateKey = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);
  const [dateKey, setDateKey] = useState<string>(currentDateKey);
  const { rows, loading, errors, refetch } = useDinnerDataByDate(dateKey);
  const [showCanceledRows, setShowCanceledRows] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<Partial<DinnerItem> | null>(null);
  const [saving, setSaving] = useState(false);
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

  const dinnerByDate = useMemo(() => {
    const grouped = new Map<string, DinnerItem[]>();
    const visibleRows = rows.filter((row) => {
      const isCanceled = row.status === "canceled_stay" || row.status === "canceled_dinner";
      return showCanceledRows || !isCanceled;
    });

    visibleRows.forEach((row) => {
      const key = row.dateKey || "日付未設定";
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(row);
    });
    return grouped;
  }, [rows, showCanceledRows]);

  const dayRows = useMemo(() => dinnerByDate.get(dateKey) ?? [], [dinnerByDate, dateKey]);

  const addEmptyReservation = async (targetDateKey: string) => {
    try {
      setSaving(true);
      const response = await fetch("/api/dinner-reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateKey: targetDateKey,
          status: "coming",
          dinner_customer_name: "name",
          dinner_adult_count: 0,
          dinner_child_count: 0,
          dinner_time: null,
          memo: "",
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { errors?: string[] };
        throw new Error(payload.errors?.[0] ?? "Failed to create reservation");
      }

      refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      window.alert(`追加に失敗しました: ${message}`);
    } finally {
      setSaving(false);
    }
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
      status: row.status,
    });
  };

  const saveEdit = async (rowId: string) => {
    if (!editingDraft) return;
    const target = rows.find((row) => row.id === rowId);
    if (!target || !isEditable(target)) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/dinner-reservations/${encodeURIComponent(rowId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: editingDraft.status ?? target.status,
          dinner_customer_name: editingDraft.dinner_customer_name ?? target.dinner_customer_name,
          dinner_adult_count: editingDraft.dinner_adult_count ?? target.dinner_adult_count,
          dinner_child_count: editingDraft.dinner_child_count ?? target.dinner_child_count,
          dinner_time:
            editingDraft.dinner_time === undefined
              ? (target.dinner_time ? target.dinner_time.toISOString() : null)
              : (editingDraft.dinner_time ? editingDraft.dinner_time.toISOString() : null),
          memo: editingDraft.memo ?? target.memo,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { errors?: string[] };
        throw new Error(payload.errors?.[0] ?? "Failed to update reservation");
      }

      cancelEdit();
      refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      window.alert(`更新に失敗しました: ${message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      {errors.length > 0 ? (
        <Stack spacing={1} sx={{ mb: 2 }}>
          {errors.map((message, index) => (
            <Alert key={`${message}-${index}`} severity="error">
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {message}
              </Typography>
            </Alert>
          ))}
        </Stack>
      ) : null}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <DaySelector dateKey={dateKey} onChange={setDateKey} />
        <FormControlLabel
          control={
            <Switch
              checked={showCanceledRows}
              onChange={(event) => setShowCanceledRows(event.target.checked)}
              size="small"
            />
          }
          label="キャンセル表示"
        />
      </Stack>
      {loading ? (
        <Stack alignItems="center" sx={{ py: 6 }}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            予約を読み込み中です…
          </Typography>
        </Stack>
      ) : !dateKey ? (
        <Typography color="text.secondary">表示月が不正です。</Typography>
      ) : (
        (() => {
          const sorted = [...dayRows].sort((a, b) => {
            const at = a.dinner_time?.getTime() ?? Number.POSITIVE_INFINITY;
            const bt = b.dinner_time?.getTime() ?? Number.POSITIVE_INFINITY;
            return at - bt;
          });

          return (
            <Paper key={dateKey} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                <Typography variant="h6">{formatDayLabel(dateKey)}</Typography>
                <IconButton
                  aria-label="追加"
                  onClick={() => void addEmptyReservation(dateKey)}
                  size="small"
                  disabled={saving}
                >
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
                            {row.status === "canceled_stay" ? (
                              <Chip
                                size="small"
                                label="宿泊キャンセル"
                                color="error"
                                variant="outlined"
                                sx={{ height: 20 }}
                              />
                            ) : null}
                            {row.status === "canceled_dinner" ? (
                              <Chip
                                size="small"
                                label="夕食のみキャンセル"
                                color="warning"
                                variant="outlined"
                                sx={{ height: 20 }}
                              />
                            ) : null}
                            <IconButton
                              aria-label="編集"
                              size="small"
                              onClick={() => beginEdit(row)}
                              disabled={!isEditable(row) || (editingId !== null && editingId !== row.id) || saving}
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
                          <Button size="small" onClick={cancelEdit} disabled={saving}>
                            キャンセル
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => void saveEdit(row.id)}
                            disabled={saving}
                          >
                            保存
                          </Button>
                        </Stack>
                      </>
                    ) : (
                      <>
                        <Typography variant="body2" color="text.secondary">
                          adult: {row.dinner_adult_count ?? 0} child: {row.dinner_child_count ?? 0}
                        </Typography>
                        {row.status !== "canceled_stay" && row.status !== "canceled_dinner" ? (
                          <Typography variant="body2" color="text.secondary">
                            time: {toTimeLabel(row.dinner_time)}
                          </Typography>
                        ) : null}
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
        })()
      )}
    </Box>
  );
};
