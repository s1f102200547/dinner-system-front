import { expect, test } from "@playwright/test";

test.describe("/api/auth/me", () => {
  test("returns proxy-level 401 when no session cookie exists", async ({ context }) => {
    const response = await context.request.get("/api/auth/me");
    expect(response.status()).toBe(401);
    await expect(response.json()).resolves.toEqual({ errors: ["Unauthorized"] });
  });

  test("returns 401 when a forged session cookie is present", async ({ context }) => {
    await context.addCookies([
      {
        name: "session",
        value: "forged-session-cookie",
        domain: "localhost",
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);

    const response = await context.request.get("/api/auth/me");
    expect(response.status()).toBe(401);
    await expect(response.json()).resolves.toEqual({ authenticated: false });
  });
});
