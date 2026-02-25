import { expect, test } from "@playwright/test";

test.describe("Unauthenticated access guard", () => {
  test("redirects protected root page to login with next", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/login\?next=%2F$/);
  });

  test("redirects protected /dinner page to login with encoded next", async ({ page }) => {
    await page.goto("/dinner?from=e2e");

    await expect(page).toHaveURL(/\/login\?next=%2Fdinner%3Ffrom%3De2e$/);
  });

  test("returns 401 JSON for protected API", async ({ request }) => {
    const response = await request.get("/api/reservations?yearMonth=2026-02");

    expect(response.status()).toBe(401);

    const payload = (await response.json()) as { errors?: string[] };
    expect(payload.errors?.[0]).toBe("Unauthorized");
  });
});

test.describe("Session cookie presence gate (middleware/proxy)", () => {
  test("allows protected page access when session cookie exists, without validating cookie content", async ({
    context,
    page,
  }) => {
    await context.addCookies([
      {
        name: "session",
        value: "e2e.invalid-but-present-session-cookie",
        domain: "localhost",
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);

    await page.goto("/");

    await expect(page).toHaveURL("http://localhost:3000/");
    await expect(page).not.toHaveURL(/\/login/);
  });
});

test.describe("API final defense with verifySessionCookie(..., true)", () => {
  test.beforeEach(async ({ context }) => {
    await context.addCookies([
      {
        name: "session",
        value: "e2e.forged-or-expired-session-cookie",
        domain: "localhost",
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
  });

  test("forged/expired session is rejected by /api/reservations", async ({ context }) => {
    const response = await context.request.get("/api/reservations?yearMonth=2026-02");
    expect(response.status()).toBe(401);
    await expect(response.json()).resolves.toEqual({ errors: ["Unauthorized"] });
  });

  test("forged/expired session is rejected by /api/dinner-reservations", async ({ context }) => {
    const response = await context.request.get("/api/dinner-reservations?yearMonth=2026-02");
    expect(response.status()).toBe(401);
    await expect(response.json()).resolves.toEqual({ errors: ["Unauthorized"] });
  });

  test("forged/expired session is rejected by /api/dinner-reservations/[id] PATCH", async ({
    context,
  }) => {
    const response = await context.request.patch("/api/dinner-reservations/e2e-id", {
      data: { memo: "e2e update" },
    });
    expect(response.status()).toBe(401);
    await expect(response.json()).resolves.toEqual({ errors: ["Unauthorized"] });
  });
});
