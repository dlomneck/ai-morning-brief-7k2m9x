import { test, expect } from "@playwright/test";
import { openPlayer } from "./fixtures.js";

test("@integration expands the selected episode inline to show notes and sources", async ({ page }) => {
  await openPlayer(page);
  await expect(page.getByRole("button", { name: /Safer Agent Workflows/ })).toBeVisible();
  await expect(page.getByText("A useful briefing.")).toBeHidden();
  await page.getByRole("button", { name: /Safer Agent Workflows/ }).click();
  await expect(page.getByText("A useful briefing.")).toBeVisible();
  await expect(page.getByRole("link", { name: "the source" })).toHaveAttribute("href", "https://example.com/source");
  await expect(page.getByRole("heading", { name: "Safer Agent Workflows" })).toBeVisible();
  await expect(page.getByText("Episode two.")).toBeVisible();
  await page.getByRole("button", { name: "Collapse transcript and sources for Safer Agent Workflows" }).click();
  await expect(page.getByText("A useful briefing.")).toBeHidden();
});

test("@integration filters listened episodes using local device state", async ({ page }) => {
  await openPlayer(page);
  await page.getByRole("button", { name: "Mark listened" }).click();
  await page.getByRole("button", { name: "Played", exact: true }).click();
  await expect(page.getByRole("button", { name: /Cataloging AI Tools for the SDLC/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Safer Agent Workflows/ })).toHaveCount(0);
});
