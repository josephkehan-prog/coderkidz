import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  use: {
    baseURL: "http://localhost:4174",
    // Locally: the machine's installed Chrome (no download). CI: bundled chromium.
    ...(process.env.CI ? {} : { channel: "chrome" as const }),
    headless: true,
  },
  webServer: {
    command: "pnpm exec vite preview --port 4174",
    url: "http://localhost:4174",
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
