import { test, expect } from "@playwright/test";
import { openPlayer } from "./fixtures.js";

test("@integration expands the selected episode inline to show notes and sources", async ({ page }) => {
  await openPlayer(page);
  const play = page.getByRole("button", { name: "Play episode: Safer Agent Workflows" });
  const disclosure = page.getByRole("button", { name: "Show transcript and sources: Safer Agent Workflows" });
  const entry = page.locator(".episode-entry").filter({ hasText: "Safer Agent Workflows" });
  const details = entry.locator(".episode-details");
  await expect(play).toBeVisible();
  await expect(details).toBeHidden();
  await play.click();
  await expect(details).toBeHidden();
  await expect(page.getByRole("heading", { name: "Safer Agent Workflows" })).toBeVisible();
  await disclosure.click();
  await expect(details).toBeVisible();
  await expect(entry.getByText("A useful briefing.")).toBeVisible();
  await expect(entry.getByRole("link", { name: "the source" })).toHaveAttribute("href", "https://example.com/source");
  await expect(page.getByText("Episode two.")).toBeHidden();
  await page.getByRole("button", { name: "Hide transcript and sources: Safer Agent Workflows" }).click();
  await expect(details).toBeHidden();
});

test("@integration filters listened episodes using local device state", async ({ page }) => {
  await openPlayer(page);
  await page.getByRole("button", { name: "Mark listened" }).click();
  await page.getByRole("button", { name: "Played", exact: true }).click();
  await expect(page.locator(".episode-entry").filter({ hasText: "Cataloging AI Tools for the SDLC" })).toBeVisible();
  await expect(page.locator(".episode-entry").filter({ hasText: "Safer Agent Workflows" })).toHaveCount(0);
});
