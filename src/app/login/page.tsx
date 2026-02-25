"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Box, Button, Paper, Stack, TextField, Typography, Alert } from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";

const getApiKey = () => {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    throw new Error("Missing required env: NEXT_PUBLIC_FIREBASE_API_KEY");
  }
  return apiKey;
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => {
    const candidate = searchParams.get("next");
    if (!candidate) return "/";
    return candidate.startsWith("/") ? candidate : "/";
  }, [searchParams]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (!response.ok || canceled) return;
        router.replace(nextPath);
      } catch {
        // Keep login form visible if check fails.
      }
    };
    void checkAuth();
    return () => {
      canceled = true;
    };
  }, [nextPath, router]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const firebaseResponse = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(getApiKey())}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            returnSecureToken: true,
          }),
        }
      );
      const firebasePayload = (await firebaseResponse.json()) as {
        idToken?: string;
        error?: { message?: string };
      };
      if (!firebaseResponse.ok || !firebasePayload.idToken) {
        throw new Error(firebasePayload.error?.message ?? "Invalid email or password");
      }

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: firebasePayload.idToken }),
      });

      const payload = (await response.json()) as { errors?: string[] };
      if (!response.ok) {
        throw new Error(payload.errors?.[0] ?? "Login failed");
      }

      router.replace(nextPath);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 2 }}>
      <Paper elevation={2} sx={{ width: "100%", maxWidth: 420, p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h5">Login</Typography>
          {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
          <Box component="form" onSubmit={onSubmit}>
            <Stack spacing={2}>
              <TextField
                required
                type="email"
                label="Email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
              />
              <TextField
                required
                type="password"
                label="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />
              <Button type="submit" variant="contained" disabled={submitting}>
                {submitting ? "Signing in..." : "Sign in"}
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}
