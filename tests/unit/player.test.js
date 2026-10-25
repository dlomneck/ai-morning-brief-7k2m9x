import { describe, expect, it } from "vitest";
import { formatTime, parseFeed, readState, sanitizeDescription, writeState, STORAGE_KEY } from "../../player/player.js";

const feed = `<?xml version="1.0"?><rss xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"><channel>
<item><title>Good episode</title><description><![CDATA[<p>Good notes</p>]]></description><enclosure url="episodes/good.mp3"/><guid>good</guid><pubDate>Fri, 24 Oct 2025 10:00:00 GMT</pubDate><itunes:duration>240</itunes:duration></item>
<item><title>Bad scheme</title><enclosure url="javascript:alert(1)"/></item>
<item><title>Missing audio</title></item>
</channel></rss>`;

describe("feed parsing", () => {
  it("maps playable RSS items and resolves relative enclosure URLs", () => {
    const episodes = parseFeed(feed, "https://podcast.example/show/");
    expect(episodes).toHaveLength(1);
    expect(episodes[0]).toMatchObject({ id: "good", title: "Good episode", audioUrl: "https://podcast.example/show/episodes/good.mp3", duration: 240 });
    expect(episodes[0].description).toContain("Good notes");
  });

  it("rejects invalid XML", () => {
    expect(() => parseFeed("<rss><item>broken")).toThrow("not valid XML");
  });
});

describe("episode notes sanitization", () => {
  it("keeps paragraphs and safe source links while removing script and unsafe URLs", () => {
    const fragment = sanitizeDescription('<p>Notes</p><script>bad()</script><a href="javascript:alert(1)">unsafe</a><a href="https://example.com">source</a>');
    const root = document.createElement("div"); root.append(fragment);
    expect(root.querySelectorAll("p")).toHaveLength(1);
    expect(root.querySelector("script")).toBeNull();
    expect(root.querySelector("a[href^=javascript]")).toBeNull();
    expect(root.querySelector("a[href^=https]")?.rel).toContain("noopener");
  });
});

describe("device-local state", () => {
  it("uses defaults for a new or malformed store", () => {
    const store = { getItem: () => "not-json" };
    expect(readState(store)).toEqual({ version: 1, currentId: "", speed: 1, episodes: {} });
  });

  it("round-trips current episode, speed, and listening positions", () => {
    const values = new Map();
    const store = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
    const state = { version: 1, currentId: "episode-1", speed: 1.5, episodes: { "episode-1": { position: 82, duration: 200, listened: false } } };
    expect(writeState(state, store)).toBe(true);
    expect(values.has(STORAGE_KEY)).toBe(true);
    expect(readState(store)).toEqual(state);
  });

  it("resets unsupported state versions and speed settings", () => {
    const store = { getItem: () => JSON.stringify({ version: 7, speed: 12, episodes: {} }) };
    expect(readState(store)).toEqual({ version: 1, currentId: "", speed: 1, episodes: {} });
  });
});

describe("time formatting", () => {
  it("formats elapsed times including hour-long episodes", () => {
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(65.9)).toBe("1:05");
    expect(formatTime(3661)).toBe("1:01:01");
    expect(formatTime(Number.NaN)).toBe("--:--");
  });
});
