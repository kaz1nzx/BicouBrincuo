import { defineConfig } from "@playwright/test";
import chromium from "@sparticuz/chromium";
const bundled = process.env.USE_BUNDLED_CHROMIUM === "1";
export default defineConfig({
  testDir: "tests",
  testMatch: "e2e.spec.ts",
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: "http://127.0.0.1:3000",
    viewport: { width: 1440, height: 1000 },
    headless: true,
    launchOptions: bundled
      ? {
          executablePath: process.env.BROWSER_EXECUTABLE,
          args: chromium.args.filter(
            (arg) =>
              ![
                "--single-process",
                "--disable-web-security",
                "--allow-running-insecure-content",
              ].includes(arg),
          ),
        }
      : {},
  },
});
