import { expect, test } from "@playwright/test";

test.describe("/api/auth/me user-existence validation", () => {
  test("returns authenticated=true when session maps to existing user", async ({ context }) => {
    await context.addCookies([
      {
        name: "session",
        value: "e2e.session.valid-user",
        domain: "localhost",
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);

    const response = await context.request.get("/api/auth/me");
    expect(response.status()).toBe(200);
    await expect(response.json()).resolves.toEqual({
      authenticated: true,
      user: {
        uid: "valid-user",
        email: "valid-user@example.com",
      },
    });
  });

  test("returns 401 when session maps to deleted user", async ({ context }) => {
    await context.addCookies([
      {
        name: "session",
        value: "e2e.session.deleted-user",
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
