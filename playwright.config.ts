import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    env: {
      ...process.env,
      PLAYWRIGHT_TEST: "1",
      E2E_AUTH_MOCK: "1",
    },
    url: "http://localhost:3000",
    reuseExistingServer: false,
    timeout: 120000,
  },
});
