"use client";

import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { useParams, useRouter, useSearchParams } from "next/navigation";

export default function GuestFormConfirmPage() {
  const router = useRouter();
  const params = useParams<{ formId?: string }>();
  const searchParams = useSearchParams();
  const reservationId = searchParams.get("reservationId") ?? "";
  const token = searchParams.get("token") ?? "";
  const formId = params?.formId ?? "1";

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f6f8", py: 4, px: 2 }}>
      <Stack spacing={3} sx={{ maxWidth: 720, mx: "auto" }}>
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h5">回答内容の確認</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            入力内容をご確認のうえ、送信してください。
          </Typography>
        </Paper>

        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="body2" color="text.secondary">
            このページは見た目のみのダミーです。
          </Typography>
        </Paper>

        <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
          <Button variant="outlined" onClick={() => router.back()}>
            戻る
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              const ok = window.confirm("送信しますか？");
              if (!ok) return;
              const params = new URLSearchParams();
              if (reservationId) params.set("reservationId", reservationId);
              if (token) params.set("token", token);
              const query = params.toString();
              router.push(`/form/${formId}/thanks${query ? `?${query}` : ""}`);
            }}
          >
            送信
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
