// Smoke: the core scholar loop — open app, write Python, run, earn stars.
// Runs against the production build (vite preview), real Pyodide, real worker.
import { expect, test } from "@playwright/test";

test("scholar can run Python and pass the first challenge", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Hello, Mayor!" })).toBeVisible();

  const editor = page.getByLabel("Python code editor");
  await editor.fill('print("Hello from the e2e test!")');
  await page.getByRole("button", { name: "▶ Run" }).click();

  // First run includes Pyodide boot (~5-10s cold).
  await expect(page.locator(".feedback.pass")).toBeVisible({ timeout: 60_000 });
  await expect(page.locator(".stdout")).toContainText("Hello from the e2e test!");
  await expect(page.locator(".xp")).not.toContainText("⚡ 0 XP");
});

test("a Python error shows a kid-readable traceback, not a crash", async ({ page }) => {
  await page.goto("/");
  const editor = page.getByLabel("Python code editor");
  await editor.fill("print(oops)");
  await page.getByRole("button", { name: "▶ Run" }).click();

  const feedback = page.locator(".feedback.fail");
  await expect(feedback).toBeVisible({ timeout: 60_000 });
  await expect(feedback).toContainText("NameError");
  await expect(feedback).not.toContainText("_pyodide");
});

test("loop challenge builds the city and switching challenges swaps starter code", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /The Highway/ }).click();
  const editor = page.getByLabel("Python code editor");
  await expect(editor).toHaveValue(/for x in range\(8\)/);

  await page.getByRole("button", { name: "▶ Run" }).click();
  await expect(page.locator(".feedback.pass")).toBeVisible({ timeout: 60_000 });
  // 8 roads at 5 coins: 200 -> 160.
  await expect(page.locator(".stats")).toContainText("💰 160");
});
