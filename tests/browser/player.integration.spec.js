import { test, expect } from "@playwright/test";
import { openPlayer } from "./fixtures.js";

test("@integration reads the RSS feed into episode cards and notes", async ({ page }) => {
  await openPlayer(page);
  await expect(page.getByRole("button", { name: /Safer Agent Workflows/ })).toBeVisible();
  await expect(page.getByText("A useful briefing.")).toBeVisible();
  await expect(page.getByRole("link", { name: "the source" })).toHaveAttribute("href", "https://example.com/source");
  await page.getByRole("button", { name: /Safer Agent Workflows/ }).click();
  await expect(page.getByRole("heading", { name: "Safer Agent Workflows" })).toBeVisible();
  await expect(page.getByText("Episode two.")).toBeVisible();
});

test("@integration filters listened episodes using local device state", async ({ page }) => {
  await openPlayer(page);
  await page.getByRole("button", { name: "Mark listened" }).click();
  await page.getByRole("button", { name: "Played", exact: true }).click();
  await expect(page.getByRole("button", { name: /Cataloging AI Tools for the SDLC/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Safer Agent Workflows/ })).toHaveCount(0);
});
