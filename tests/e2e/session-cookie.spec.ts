import { expect, test } from "@playwright/test";

const SESSION_COOKIE_NAME = "session";
const FOURTEEN_DAYS_SECONDS = 14 * 24 * 60 * 60;

test.describe("Login API session cookie issuance", () => {
  test("issues 14-day httpOnly session cookie when idToken is valid", async ({ context }) => {
    const response = await context.request.post("/api/auth/login", {
      data: { idToken: "e2e.valid.id-token" },
    });

    expect(response.status()).toBe(200);
    const setCookie = response.headers()["set-cookie"] ?? "";
    expect(setCookie).toContain(`${SESSION_COOKIE_NAME}=`);
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("Path=/");
    expect(setCookie.toLowerCase()).toContain("samesite=lax");
    expect(setCookie).toContain(`Max-Age=${FOURTEEN_DAYS_SECONDS}`);

    const cookies = await context.cookies();
    const sessionCookie = cookies.find((cookie) => cookie.name === SESSION_COOKIE_NAME);
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie?.httpOnly).toBe(true);
    expect(sessionCookie?.path).toBe("/");
    expect(sessionCookie?.sameSite).toBe("Lax");

    const now = Math.floor(Date.now() / 1000);
    const ttl = (sessionCookie?.expires ?? now) - now;
    expect(ttl).toBeGreaterThanOrEqual(FOURTEEN_DAYS_SECONDS - 120);
    expect(ttl).toBeLessThanOrEqual(FOURTEEN_DAYS_SECONDS + 120);
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
