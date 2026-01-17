"use client";

import { Box, Paper, Stack, Typography } from "@mui/material";

export default function GuestFormThanksPage() {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f6f8", py: 4, px: 2 }}>
      <Stack spacing={3} sx={{ maxWidth: 720, mx: "auto" }}>
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h4">ご回答ありがとうございました</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            送信が完了しました。
          </Typography>
        </Paper>
      </Stack>
    </Box>
  );
}
