"use client";

import {
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
  const params = useParams<{ formId?: string }>();
  const router = useRouter();
  const reservationId = searchParams.get("reservationId") ?? undefined;
  const token = searchParams.get("token") ?? "";
  const formId = params?.formId ?? "1";
  const name = findReservationName(reservationId);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f6f8", py: 4, px: 2 }}>
      <Stack spacing={3} sx={{ maxWidth: 720, mx: "auto" }}>
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Stack spacing={1}>
            <Typography variant="h4">ゲストフォーム</Typography>
            <Typography variant="body2" color="text.secondary">
              ご予約内容に関する確認のため、以下をご回答ください。
            </Typography>
          </Stack>
        </Paper>

        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            お名前
          </Typography>
          {name ? (
            <Typography variant="h6" sx={{ mt: 0.5 }}>
              {name}
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              予約が見つかりません。
            </Typography>
          )}
        </Paper>

        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <FormControl component="fieldset">
            <FormLabel>希望の時間帯</FormLabel>
            <RadioGroup>
              <FormControlLabel value="17:30" control={<Radio />} label="17:30〜" />
              <FormControlLabel value="19:30" control={<Radio />} label="19:30〜" />
            </RadioGroup>
          </FormControl>
        </Paper>

        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <FormControl component="fieldset">
            <FormLabel>アレルギーの有無</FormLabel>
            <RadioGroup>
              <FormControlLabel value="no" control={<Radio />} label="なし" />
              <FormControlLabel value="yes" control={<Radio />} label="あり" />
            </RadioGroup>
          </FormControl>
          <TextField
            label="アレルギー詳細（ある場合）"
            placeholder="例：甲殻類、ナッツ など"
            fullWidth
            multiline
            minRows={2}
            sx={{ mt: 2 }}
          />
        </Paper>

        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <TextField
            label="その他連絡事項"
            placeholder="ご要望などがあればご記入ください"
            fullWidth
            multiline
            minRows={3}
          />
        </Paper>

        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            size="large"
            onClick={() => {
              const params = new URLSearchParams();
              if (reservationId) params.set("reservationId", reservationId);
              if (token) params.set("token", token);
              const query = params.toString();
              router.push(`/form/${formId || "1"}/confirm${query ? `?${query}` : ""}`);
            }}
          >
            確認
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
