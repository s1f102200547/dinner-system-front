import { expect, test } from "@playwright/test";

const SESSION_COOKIE_NAME = "session";
const FOURTEEN_DAYS_SECONDS = 14 * 24 * 60 * 60;

test.describe("Login API session cookie issuance", () => {
  test("stores a 14-day session cookie when /api/auth/login responds with Set-Cookie", async ({
    context,
    page,
  }) => {
    await page.route("**/api/auth/login", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: {
          "set-cookie": `${SESSION_COOKIE_NAME}=e2e.mock.session; Path=/; HttpOnly; SameSite=Lax; Max-Age=${FOURTEEN_DAYS_SECONDS}`,
        },
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.goto("/login");
    const status = await page.evaluate(async () => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: "mock-id-token" }),
      });
      return response.status;
    });
    expect(status).toBe(200);

    const cookies = await context.cookies();
    const sessionCookie = cookies.find((cookie) => cookie.name === SESSION_COOKIE_NAME);
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie?.httpOnly).toBe(true);
    expect(sessionCookie?.path).toBe("/");
    expect(sessionCookie?.sameSite).toBe("Lax");
  });

  test("returns 401 and no session cookie when idToken is invalid", async ({ context }) => {
    const response = await context.request.post("/api/auth/login", {
      data: { idToken: "e2e.invalid-token" },
    });

    expect(response.status()).toBe(401);

    const cookies = await context.cookies();
    const sessionCookie = cookies.find((cookie) => cookie.name === SESSION_COOKIE_NAME);
    expect(sessionCookie).toBeUndefined();
  });
});
