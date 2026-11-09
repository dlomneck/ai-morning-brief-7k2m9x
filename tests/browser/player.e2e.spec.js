import { test, expect } from "@playwright/test";
import { openPlayer } from "./fixtures.js";

test("@e2e plays, changes speed, automatically advances, and restores listened state", async ({ page }) => {
  await openPlayer(page);
  await page.getByLabel("Playback speed").selectOption("1.5");
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator("#play-label")).toHaveText("PAUSE");
  expect(await page.locator("#audio").evaluate(audio => audio.playbackRate)).toBe(1.5);
  await page.locator("#audio").evaluate(audio => { audio.currentTime = 216; audio.dispatchEvent(new Event("timeupdate")); });
  await expect(page.locator("#now-status")).toContainText("Listened", { timeout: 3000 });
  await page.locator("#audio").evaluate(audio => { audio.dispatchEvent(new Event("ended")); });
  await expect(page.getByRole("heading", { name: "Safer Agent Workflows" })).toBeVisible();
  await expect(page.locator("#play-label")).toHaveText("PAUSE");
  await page.reload();
  await expect(page.getByRole("heading", { name: "Safer Agent Workflows" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Mark listened" })).toHaveText("Mark listened");
  await page.getByRole("button", { name: "Played", exact: true }).click();
  await expect(page.locator(".episode-entry").filter({ hasText: "Cataloging AI Tools for the SDLC" })).toBeVisible();
});

test("@e2e exposes large, labeled playback controls at tablet viewport", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openPlayer(page);
  for (const control of ["Play", "Previous episode", "Next episode"]) {
    const button = page.getByRole("button", { name: control, exact: true });
    await expect(button).toBeVisible();
    const box = await button.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(48);
    expect(box?.width).toBeGreaterThanOrEqual(48);
  }
  await expect(page.getByRole("link", { name: /RSS feed/ })).toBeVisible();
});

test("@e2e keeps the player above the queue on wide screens and collapses episode notes by default", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await openPlayer(page);
  const player = await page.locator(".now-playing").boundingBox();
  const queue = await page.locator(".episode-panel").boundingBox();
  const controls = await page.locator(".transport").boundingBox();
  expect(player && queue && controls).toBeTruthy();
  expect(player.y).toBeLessThan(queue.y);
  expect(controls.y + controls.height).toBeLessThanOrEqual(player.y + player.height);
  await expect(page.locator(".episode-details").first()).toBeHidden();
  expect(await page.locator("body").evaluate(body => body.scrollWidth)).toBeLessThanOrEqual(1920);
});
