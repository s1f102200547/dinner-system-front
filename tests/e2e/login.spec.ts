import { expect, test } from "@playwright/test";

test.describe("Login page identity toolkit flow", () => {
  test("submits email/password to Identity Toolkit and receives idToken", async ({ page }) => {
    let toolkitRequestBody: {
      email?: string;
      password?: string;
      returnSecureToken?: boolean;
    } | null = null;
    let loginApiRequestBody: { idToken?: string } | null = null;

    await page.route("https://identitytoolkit.googleapis.com/**", async (route) => {
      const request = route.request();
      const method = request.method();

      if (method === "OPTIONS") {
        await route.fulfill({
          status: 204,
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "POST, OPTIONS",
            "access-control-allow-headers": "content-type",
          },
        });
        return;
      }

      if (method === "POST") {
        toolkitRequestBody = request.postDataJSON() as {
          email?: string;
          password?: string;
          returnSecureToken?: boolean;
        };
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: {
            "access-control-allow-origin": "*",
          },
          body: JSON.stringify({
            idToken: "e2e.mock.id-token",
          }),
        });
        return;
      }

      await route.abort();
    });

    await page.route("**/api/auth/login", async (route) => {
      loginApiRequestBody = route.request().postDataJSON() as { idToken?: string };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.goto("/login");
    await page.getByLabel("Email").fill("e2e@example.com");
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect.poll(() => toolkitRequestBody).not.toBeNull();
    expect(toolkitRequestBody).toEqual({
      email: "e2e@example.com",
      password: "password123",
      returnSecureToken: true,
    });

    await expect.poll(() => loginApiRequestBody).not.toBeNull();
    expect(loginApiRequestBody).toEqual({
      idToken: "e2e.mock.id-token",
    });
  });

  test("invalid email/password does not receive idToken and does not call /api/auth/login", async ({ page }) => {
    let loginApiCalled = false;

    await page.route("https://identitytoolkit.googleapis.com/**", async (route) => {
      const request = route.request();
      const method = request.method();

      if (method === "OPTIONS") {
        await route.fulfill({
          status: 204,
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "POST, OPTIONS",
            "access-control-allow-headers": "content-type",
          },
        });
        return;
      }

      if (method === "POST") {
        await route.fulfill({
          status: 400,
          contentType: "application/json",
          headers: {
            "access-control-allow-origin": "*",
          },
          body: JSON.stringify({
            error: {
              message: "INVALID_LOGIN_CREDENTIALS",
            },
          }),
        });
        return;
      }

      await route.abort();
    });

    await page.route("**/api/auth/login", async (route) => {
      loginApiCalled = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.goto("/login");
    await page.getByLabel("Email").fill("wrong@example.com");
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText("INVALID_LOGIN_CREDENTIALS")).toBeVisible();
    expect(loginApiCalled).toBe(false);
    await expect(page).toHaveURL(/\/login$/);
  });
});
