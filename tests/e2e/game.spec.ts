import { test, expect } from "@playwright/test";
import type { Game } from "../../src/core/game";
declare global {
  interface Window {
    __silverRush?: Game;
  }
}
test("desktop gameplay, collision, pause, results, save and menus", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: "ابدأ الركض" }).click();
  await expect(page.locator("#hud")).toBeVisible();
  await page.waitForTimeout(500);
  const before = await page.evaluate(() => window.__silverRush!.runner.z);
  await page.keyboard.down("KeyD");
  await page.waitForTimeout(500);
  await page.keyboard.up("KeyD");
  expect(
    await page.evaluate(() => window.__silverRush!.runner.x),
  ).toBeGreaterThan(0.4);
  expect(
    await page.evaluate(() => window.__silverRush!.runner.z),
  ).toBeGreaterThan(before);
  await page.keyboard.press("Space");
  await expect
    .poll(() => page.evaluate(() => window.__silverRush!.runner.y))
    .toBeGreaterThan(0);
  await expect
    .poll(() => page.evaluate(() => window.__silverRush!.runner.y))
    .toBe(0);
  await page.keyboard.press("KeyS");
  await expect
    .poll(() => page.evaluate(() => window.__silverRush!.runner.slide))
    .toBeGreaterThan(0);
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "متابعة الركض" }),
  ).toBeVisible();
  const paused = await page.evaluate(() => window.__silverRush!.runner.z);
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => window.__silverRush!.runner.z)).toBe(paused);
  await page.getByRole("button", { name: "متابعة الركض" }).click();
  await page.evaluate(() => {
    const g = window.__silverRush!;
    g.runner.z = 44;
    g.runner.x = -2.8;
    g.runner.y = 0;
    g.runner.vy = 0;
    g.runner.slide = 0;
    g.runner.vx = 0;
    g.clock.advance(0.1, () => g["tick"]());
  });
  expect(await page.evaluate(() => window.__silverRush!.runner.lives)).toBe(2);
  await page.evaluate(() => {
    const g = window.__silverRush!;
    g.start();
    g.audio.music = 0;
    g.audio.effects = 0;
    for (let i = 0; i < 15000 && g.status === "playing"; i++) {
      const o = g.world.obstacles.find(
        (o) => o.kind !== "coin" && o.z >= g.runner.z - 1,
      );
      g.input.target = o && o.x > 0 ? -4.1 : 4.1;
      g.clock.advance(1 / 60, () => g["tick"]());
    }
  });
  await expect(
    page.getByRole("heading", { name: "وصلت بسلام!" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => window.__silverRush!.save.data.completed),
  ).toBe(true);
  await page.reload();
  await page.getByRole("button", { name: "المراحل", exact: true }).click();
  await expect(page.getByText("قيد التطوير — غير قابلة للعب بعد")).toHaveCount(
    4,
  );
  expect(errors).toEqual([]);
});
test("portrait touch layout and swipe gestures", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "ابدأ الركض" }).click();
  // Browser-generated mouse pointer sequence exercises capture and swipe detection.
  await page.mouse.move(150, 450);
  await page.mouse.down();
  await page.mouse.move(260, 450, { steps: 5 });
  await page.waitForTimeout(300);
  await page.mouse.up();
  expect(
    await page.evaluate(() => window.__silverRush!.runner.x),
  ).toBeGreaterThan(0.3);
  await page.mouse.move(180, 450);
  await page.mouse.down();
  await page.mouse.move(180, 360, { steps: 5 });
  await page.waitForTimeout(100);
  await page.mouse.up();
  expect(
    await page.evaluate(() => window.__silverRush!.runner.y),
  ).toBeGreaterThan(0);
  await page.screenshot({ path: "test-results/mobile-game.png" });
});
