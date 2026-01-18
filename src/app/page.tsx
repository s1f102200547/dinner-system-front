"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  IconButton,
  Chip,
  CircularProgress,
  Paper,
  Select,
  MenuItem,
  Stack,
  TextField,
  Typography,
  Button,
  Snackbar,
  Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddLinkIcon from "@mui/icons-material/AddLink";
import MonthSelector from "@/app/components/MonthSelector";
import { useDinnerDataByMonth } from "@/app/hooks/useDinnerDataByMonth";
import type { DinnerItem, StaffShift } from "@/app/types/dinner";
import { parseDate } from "@/app/utils/dateUtils";
import { dummyDinnerByDate } from "@/app/data/dummyDinnerByDate";
import { dummyDinnerMenuById } from "@/app/data/dummyDinnerMenuById";
import { dummyDinnerDailySummaryByDate } from "@/app/data/dummyDinnerDailySummaryByDate";
import type { DinnerDailySummary } from "@/app/types/dinnerDailySummary";

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

const toItemsLabel = (
  items: DinnerItem["items"] | undefined,
  menuById: typeof dummyDinnerMenuById
) => {
  if (!items || items.length === 0) return "-";
  return items
    .map((item) => {
      const name = menuById[item.item_id]?.item_name ?? item.item_id;
      return `${name} x${item.quantity}`;
    })
    .join(", ");
};

const toShiftLabel = (shift: StaffShift) => {
  const start = toTimeLabel(shift.start_time);
  const end = toTimeLabel(shift.end_time);
  return `${shift.staff_name} ${start}~${end}`;
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

const compactSelectSx = {
  minWidth: 120,
  height: 32,
  "& .MuiSelect-select": {
    py: 0.5,
    fontSize: 13,
  },
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

type UiStatus = "coming" | "canceled" | "done";

const STATUS_LABEL: Record<UiStatus, string> = {
  coming: "coming",
  canceled: "canceled",
  done: "done",
};

const STATUS_COLOR: Record<UiStatus, "success" | "default" | "info"> = {
  coming: "success",
  canceled: "default",
  done: "info",
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

const createToken = () => {
  const cryptoObj = globalThis.crypto;
  if (cryptoObj?.randomUUID) return cryptoObj.randomUUID().replace(/-/g, "");
  const bytes = new Uint8Array(16);
  cryptoObj?.getRandomValues?.(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
};

const DinnerPage = () => {
  const currentYearMonth = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  }, []);
  const menuOptions = useMemo(() => Object.values(dummyDinnerMenuById), []);
  const [yearMonth, setYearMonth] = useState<string>(currentYearMonth);
  const { rows, shiftsByDate, loading } = useDinnerDataByMonth(yearMonth);

  const [createdItems, setCreatedItems] = useState<DinnerItem[]>([]);
  const [overrides, setOverrides] = useState<Record<string, Partial<DinnerItem>>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<Partial<DinnerItem> | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [dailySummaryByDate, setDailySummaryByDate] = useState<
    Record<string, DinnerDailySummary>
  >(dummyDinnerDailySummaryByDate);
  const editingCardRef = useRef<HTMLDivElement | null>(null);

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
      items: [],
      memo: "",
      created_by: "dinner_front",
      created_at: now,
      updated_at: now,
    };
    setCreatedItems((prev) => [...prev, created]);
  };

  const beginEdit = (row: DinnerItem) => {
    setEditingId(row.id);
    setEditingDraft({
      dinner_customer_name: row.dinner_customer_name,
      dinner_adult_count: row.dinner_adult_count,
      dinner_child_count: row.dinner_child_count,
      dinner_time: row.dinner_time,
      items: row.items ?? [],
      memo: row.memo,
      status: row.status,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingDraft(null);
  };

  const saveEdit = (rowId: string) => {
    if (!editingDraft) return;
    updateRow(rowId, editingDraft);
    cancelEdit();
  };

  const copyGuestLink = async (row: DinnerItem) => {
    const formId = "1";
    const token = createToken();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
    const url = `${baseUrl}/form/${formId}?reservationId=${row.id}&token=${token}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = url;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setSnackbarOpen(true);
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
          const shifts = [...(shiftsByDate[dateKey] ?? [])].sort(
            (a, b) => a.start_time.getTime() - b.start_time.getTime()
          );
          const isConfirmed = Boolean(dailySummaryByDate[dateKey]);
          return (
          <Paper key={dateKey} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ flexWrap: "wrap", minWidth: 0 }}>
                <Typography variant="h6">{formatDayLabel(dateKey)}</Typography>
                {shifts.length > 0 ? (
                  <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                    {shifts.map((shift) => (
                      <Typography
                        key={`${shift.staff_id}-${shift.start_time.toISOString()}`}
                        variant="caption"
                        color="text.secondary"
                      >
                        {toShiftLabel(shift)}
                      </Typography>
                    ))}
                  </Stack>
                ) : null}
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Button
                  size="small"
                  variant={isConfirmed ? "outlined" : "contained"}
                  onClick={() => {
                    if (!isConfirmed) {
                      const ok = window.confirm("この日付を確定しますか？");
                      if (!ok) return;
                    }
                    setDailySummaryByDate((prev) => {
                      const next = { ...prev };
                      if (isConfirmed) {
                        delete next[dateKey];
                        return next;
                      }
                      const byId = dummyDinnerByDate[dateKey];
                      if (!byId) return next;
                      let total_sales = 0;
                      let total_groups = 0;
                      let total_guests = 0;
                      let canceled_groups = 0;
                      let canceled_guests = 0;
                      Object.values(byId).forEach((row) => {
                        const isCanceled = row.status === "canceled";
                        const guestCount =
                          (row.dinner_adult_count ?? 0) + (row.dinner_child_count ?? 0);
                        if (isCanceled) {
                          canceled_groups += 1;
                          canceled_guests += guestCount;
                          return;
                        }
                        total_groups += 1;
                        total_guests += guestCount;
                        if (row.status === "done") {
                          (row.items ?? []).forEach((item) => {
                            const price = dummyDinnerMenuById[item.item_id]?.price ?? 0;
                            total_sales += price * item.quantity;
                          });
                        }
                      });
                      next[dateKey] = {
                        store_id: "asakusa_001",
                        dateKey,
                        total_sales,
                        total_groups,
                        total_guests,
                        canceled_groups,
                        canceled_guests,
                      };
                      return next;
                    });
                    if (!isConfirmed) cancelEdit();
                  }}
                >
                  {isConfirmed ? "解除" : "確定"}
                </Button>
                <IconButton
                  aria-label="追加"
                  onClick={() => addEmptyReservation(dateKey)}
                  size="small"
                  disabled={isConfirmed}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Stack>
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
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <IconButton
                            aria-label="リンク生成"
                            size="small"
                            onClick={() => void copyGuestLink(row)}
                            disabled={editingId !== null || isConfirmed}
                          >
                            <AddLinkIcon fontSize="small" />
                          </IconButton>
                          <Typography variant="body2" color="text.secondary">
                            {row.status}
                          </Typography>
                          <IconButton
                            aria-label="編集"
                            size="small"
                            onClick={() => beginEdit(row)}
                            disabled={isConfirmed || (editingId !== null && editingId !== row.id)}
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
                      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                        <Select
                          size="small"
                          value={editingDraft?.status ?? row.status}
                          onChange={(e) =>
                            setEditingDraft((prev) => ({
                              ...(prev ?? {}),
                              status: e.target.value as DinnerItem["status"],
                            }))
                          }
                          sx={compactSelectSx}
                        >
                          <MenuItem value="coming">coming</MenuItem>
                          <MenuItem value="canceled">canceled</MenuItem>
                          <MenuItem value="done">done</MenuItem>
                        </Select>
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
                          sx={{ flex: 1, ...compactTextFieldSx }}
                        />
                      </Stack>
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
                    </>
                  ) : (
                    <>
                      <Typography variant="body2" color="text.secondary">
                        adult: {row.dinner_adult_count ?? 0} child: {row.dinner_child_count ?? 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        time: {toTimeLabel(row.dinner_time)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        items: {toItemsLabel(row.items, dummyDinnerMenuById)}
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
                  {editingId === row.id ? (
                    <>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          items
                        </Typography>
                        <IconButton
                          aria-label="追加"
                          size="small"
                          onClick={() => {
                            setEditingDraft((prev) => {
                              const currentItems = prev?.items ?? row.items ?? [];
                              return {
                                ...(prev ?? {}),
                                items: [...currentItems, { item_id: "", quantity: 0 }],
                              };
                            });
                          }}
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                      <Stack spacing={0.5} sx={{ mt: 1 }}>
                        {(editingDraft?.items ?? row.items ?? []).map((item, index) => {
                          return (
                            <Stack
                              key={`${item.item_id || "empty"}-${index}`}
                              direction="row"
                              spacing={1}
                              alignItems="center"
                            >
                              <Select
                                size="small"
                                value={item.item_id}
                                onChange={(e) => {
                                  const nextId = e.target.value;
                                  setEditingDraft((prev) => {
                                    const currentItems = prev?.items ?? row.items ?? [];
                                    const updated = currentItems.map((current, idx) =>
                                      idx === index ? { ...current, item_id: nextId } : current
                                    );
                                    if (!nextId) return { ...(prev ?? {}), items: updated };
                                    const firstIndex = updated.findIndex(
                                      (current, idx) => current.item_id === nextId && idx !== index
                                    );
                                    if (firstIndex >= 0) {
                                      updated[firstIndex].quantity += updated[index].quantity;
                                      updated.splice(index, 1);
                                    }
                                    return { ...(prev ?? {}), items: updated };
                                  });
                                }}
                                sx={compactSelectSx}
                              >
                                <MenuItem value="">-</MenuItem>
                                {menuOptions.map((menu) => (
                                  <MenuItem key={menu.item_id} value={menu.item_id}>
                                    {menu.item_name}
                                  </MenuItem>
                                ))}
                              </Select>
                              <TextField
                                label="qty"
                                type="number"
                                size="small"
                                value={item.quantity}
                                onChange={(e) => {
                                  const next = Number(e.target.value);
                                  const quantity = Number.isFinite(next) && next >= 0 ? next : 0;
                                  setEditingDraft((prev) => {
                                    const currentItems = prev?.items ?? row.items ?? [];
                                    const updated = currentItems.map((current, idx) =>
                                      idx === index ? { ...current, quantity } : current
                                    );
                                    return { ...(prev ?? {}), items: updated };
                                  });
                                }}
                                inputProps={{ min: 0, max: 99 }}
                                sx={{ width: 90, ...compactTextFieldSx }}
                              />
                              <IconButton
                                aria-label="削除"
                                size="small"
                                sx={{ width: 24, height: 24 }}
                                onClick={() => {
                                  setEditingDraft((prev) => {
                                    const currentItems = prev?.items ?? row.items ?? [];
                                    const updated = currentItems.filter((_, idx) => idx !== index);
                                    return { ...(prev ?? {}), items: updated };
                                  });
                                }}
                              >
                                <DeleteIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Stack>
                          );
                        })}
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
                        <Button size="small" variant="contained" onClick={() => saveEdit(row.id)}>
                          保存
                        </Button>
                      </Stack>
                    </>
                  ) : null}
                </Paper>
              ))}
            </Box>
          </Paper>
          );
        })
      )}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2500}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setSnackbarOpen(false)}>
          ゲスト用リンクをコピーしました
        </Alert>
      </Snackbar>
    </Box>
  );
};

function StatusChip({
  status,
  onToggle,
  disabled,
}: {
  status: DinnerItem["status"];
  onToggle: (next: DinnerItem["status"]) => void;
  disabled?: boolean;
}) {
  const uiStatus: UiStatus = status === "canceled" ? "canceled" : "coming";

  return (
    <Chip
      label={STATUS_LABEL[uiStatus]}
      color={STATUS_COLOR[uiStatus]}
      size="small"
      clickable
      onClick={() => {
        if (disabled) return;
        onToggle(uiStatus === "coming" ? "canceled" : "coming");
      }}
      disabled={disabled}
      sx={{ flexShrink: 0 }}
    />
  );
}
