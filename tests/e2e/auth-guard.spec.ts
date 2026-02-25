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
