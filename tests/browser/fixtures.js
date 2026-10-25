import { expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

const feed = await readFile(new URL("../fixtures/feed.xml", import.meta.url), "utf8");

export async function openPlayer(page) {
  await page.addInitScript(() => {
    const mediaState = new WeakMap();
    Object.defineProperty(HTMLMediaElement.prototype, "duration", { configurable: true, get() { return 240; } });
    Object.defineProperty(HTMLMediaElement.prototype, "paused", { configurable: true, get() { return mediaState.get(this)?.paused ?? true; } });
    Object.defineProperty(HTMLMediaElement.prototype, "currentTime", { configurable: true, get() { return mediaState.get(this)?.time ?? 0; }, set(value) { const old = mediaState.get(this) ?? { paused: true, time: 0 }; mediaState.set(this, { ...old, time: Number(value) }); } });
    HTMLMediaElement.prototype.load = function () {};
    HTMLMediaElement.prototype.play = function () {
      mediaState.set(this, { ...(mediaState.get(this) ?? { time: 0 }), paused: false });
      this.dispatchEvent(new Event("loadedmetadata"));
      this.dispatchEvent(new Event("play"));
      return Promise.resolve();
    };
    HTMLMediaElement.prototype.pause = function () {
      mediaState.set(this, { ...(mediaState.get(this) ?? { time: 0 }), paused: true });
      this.dispatchEvent(new Event("pause"));
    };
  });
  await page.route("**/feed.xml", route => route.fulfill({ status: 200, contentType: "application/rss+xml", body: feed }));
  await page.route("**/*.mp3", route => route.fulfill({ status: 200, contentType: "audio/mpeg", body: Buffer.alloc(8) }));
  await page.goto("/player/");
  await expect(page.getByRole("heading", { name: "Cataloging AI Tools for the SDLC" })).toBeVisible();
}
