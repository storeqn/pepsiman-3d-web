import { test, expect } from "@playwright/test";
test("production rendering, service worker and offline cold reload", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "ابدأ الركض" })).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await page.screenshot({ path: "test-results/desktop-menu.png" });
  const manifest = await page.evaluate(
    async () => await (await fetch("/manifest.webmanifest")).json(),
  );
  expect(manifest.display).toBe("standalone");
  expect(await page.evaluate(() => "__silverRush" in window)).toBe(false);
  await context.setOffline(true);
  await page.reload();
  await page.getByRole("button", { name: "ابدأ الركض" }).click();
  await expect(page.locator("#hud")).toBeVisible();
  await expect
    .poll(async () =>
      Number((await page.locator("#score").textContent())?.replaceAll(",", "")),
    )
    .toBeGreaterThan(0);
  await page.screenshot({ path: "test-results/desktop-game.png" });
  expect(errors).toEqual([]);
});
