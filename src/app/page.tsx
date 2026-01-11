import { Box, Button, Container, Stack, Typography } from "@mui/material";

export default function Home() {
  return (
    <Box sx={{ py: 6 }}>
      <Container maxWidth="sm">
        <Stack spacing={2}>
          <Typography variant="h4" component="h1">
            Next.js + TypeScript + MUI
          </Typography>
          <Typography color="text.secondary">
            `src/app/page.tsx` を編集して開発を始められます。
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="contained">Primary</Button>
            <Button variant="outlined">Outlined</Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
