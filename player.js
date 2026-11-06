export const STORAGE_KEY = "morning-ai-brief-player-v1";
const ALLOWED_TAGS = new Set(["P", "BR", "STRONG", "B", "EM", "I", "UL", "OL", "LI", "A", "H2", "H3", "BLOCKQUOTE"]);

export function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "--:--";
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}` : `${minutes}:${String(secs).padStart(2, "0")}`;
}

function firstTagText(parent, localName) {
  const match = [...parent.getElementsByTagName("*")].find(node => node.localName?.toLowerCase() === localName.toLowerCase());
  return match?.textContent?.trim() ?? "";
}

function safeMediaUrl(value, baseUrl) {
  if (!value || !value.trim()) return "";
  try {
    const url = new URL(value, baseUrl);
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch { return ""; }
}

export function parseFeed(xmlText, baseUrl = globalThis.location?.href ?? "https://example.invalid/") {
  const doc = new DOMParser().parseFromString(xmlText, "application/xml");
  if (doc.querySelector("parsererror")) throw new Error("The podcast feed is not valid XML.");
  const items = [...doc.getElementsByTagName("item")];
  return items.map((item, index) => {
    const title = firstTagText(item, "title");
    const enclosure = item.getElementsByTagName("enclosure")[0];
    const audioUrl = safeMediaUrl(enclosure?.getAttribute("url") ?? "", baseUrl);
    if (!title || !audioUrl) return null;
    const description = firstTagText(item, "description") || firstTagText(item, "encoded");
    const pubDate = firstTagText(item, "pubDate");
    const guid = firstTagText(item, "guid") || audioUrl;
    const duration = Number.parseInt(firstTagText(item, "duration"), 10);
    return { id: guid, title, description, audioUrl, pubDate, date: pubDate ? new Date(pubDate) : null, duration: Number.isFinite(duration) ? duration : 0, index };
  }).filter(Boolean);
}

export function readState(storage = globalThis.localStorage) {
  const empty = { version: 1, currentId: "", speed: 1, episodes: {} };
  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY) ?? "null");
    if (!parsed || parsed.version !== 1 || typeof parsed.episodes !== "object" || !parsed.episodes) return empty;
    return {
      version: 1,
      currentId: typeof parsed.currentId === "string" ? parsed.currentId : "",
      speed: [0.8, 1, 1.25, 1.5, 1.75, 2].includes(Number(parsed.speed)) ? Number(parsed.speed) : 1,
      episodes: parsed.episodes,
    };
  } catch { return empty; }
}

export function writeState(state, storage = globalThis.localStorage) {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(state)); return true; }
  catch { return false; }
}

export function sanitizeDescription(markup, targetDocument = globalThis.document) {
  const source = new DOMParser().parseFromString(markup ?? "", "text/html");
  const output = targetDocument.createDocumentFragment();
  const appendSafe = (parent, node) => {
    if (node.nodeType === 3) { parent.append(targetDocument.createTextNode(node.textContent ?? "")); return; }
    if (node.nodeType !== 1) return;
    if (!ALLOWED_TAGS.has(node.tagName)) {
      for (const child of node.childNodes) appendSafe(parent, child);
      return;
    }
    const element = targetDocument.createElement(node.tagName.toLowerCase());
    if (node.tagName === "A") {
      const href = safeMediaUrl(node.getAttribute("href") ?? "", targetDocument.baseURI);
      if (href) { element.href = href; element.rel = "noopener noreferrer"; element.target = "_blank"; }
    }
    for (const child of node.childNodes) appendSafe(element, child);
    parent.append(element);
  };
  for (const node of source.body.childNodes) appendSafe(output, node);
  return output;
}

const el = id => document.getElementById(id);
let episodes = [];
let state = readState();
let currentId = "";
let filter = "all";
let seeking = false;
let saveTimer = 0;
let audioReadyForId = "";

function currentEpisode() { return episodes.find(episode => episode.id === currentId) ?? null; }
function episodeState(id) { return state.episodes[id] ?? { position: 0, duration: 0, listened: false }; }
function persist() {
  state.currentId = currentId;
  state.speed = Number(el("speed").value);
  writeState(state);
}
function updateEpisodeState(id, patch) {
  state.episodes[id] = { ...episodeState(id), ...patch, updatedAt: Date.now() };
  persist();
}
function currentLabel() {
  const episode = currentEpisode();
  if (!episode) return;
  const saved = episodeState(episode.id);
  el("now-title").textContent = episode.title;
  el("now-date").textContent = episode.date && !Number.isNaN(episode.date.valueOf()) ? episode.date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }) : "Morning AI Brief";
  el("now-status").textContent = saved.listened ? "Listened · saved on this device" : saved.position > 0 ? `Resume from ${formatTime(saved.position)} · saved on this device` : "Not played yet · progress saves on this device";
  el("description").replaceChildren(sanitizeDescription(episode.description));
  el("play").disabled = false;
  el("mark-listened").disabled = false;
  el("mark-listened").textContent = saved.listened ? "Mark unplayed" : "Mark listened";
  el("seek").disabled = false;
  el("previous").disabled = episodes.indexOf(episode) <= 0;
  el("next").disabled = episodes.indexOf(episode) >= episodes.length - 1;
  el("play-label").textContent = el("audio").paused ? "PLAY" : "PAUSE";
  el("play-icon").textContent = el("audio").paused ? "▶" : "Ⅱ";
  el("play").setAttribute("aria-label", el("audio").paused ? "Play" : "Pause");
}
function renderList() {
  const list = el("episode-list");
  list.replaceChildren();
  const visible = episodes.filter(episode => {
    const listened = episodeState(episode.id).listened;
    return filter === "all" || (filter === "listened" ? listened : !listened);
  });
  if (!visible.length) {
    const empty = document.createElement("p");
    empty.className = "saved-status";
    empty.textContent = episodes.length ? "Nothing in this filter yet." : "No episodes are available yet.";
    list.append(empty);
    return;
  }
  for (const episode of visible) {
    const saved = episodeState(episode.id);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `episode-card${episode.id === currentId ? " selected" : ""}`;
    button.setAttribute("aria-pressed", String(episode.id === currentId));
    const play = document.createElement("span"); play.className = "card-play"; play.setAttribute("aria-hidden", "true"); play.textContent = episode.id === currentId && !el("audio").paused ? "Ⅱ" : "▶";
    const copy = document.createElement("span"); copy.className = "card-copy";
    const date = document.createElement("span"); date.className = "card-date"; date.textContent = episode.date && !Number.isNaN(episode.date.valueOf()) ? episode.date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "Recent episode";
    const title = document.createElement("span"); title.className = "card-title"; title.textContent = episode.title;
    copy.append(date, title);
    const status = document.createElement("span"); status.className = `card-state${saved.listened ? "" : " unplayed"}`; status.textContent = saved.listened ? "LISTENED" : saved.position > 0 ? "RESUME" : "NEW";
    button.append(play, copy, status);
    button.addEventListener("click", () => chooseEpisode(episode.id, true));
    list.append(button);
  }
}
function setMessage(message) { el("player-message").textContent = message; }
function selectEpisode(id) {
  if (!episodes.some(episode => episode.id === id)) return;
  const audio = el("audio");
  if (!audio.paused) audio.pause();
  currentId = id;
  audioReadyForId = "";
  audio.removeAttribute("src");
  audio.load();
  el("elapsed").textContent = "0:00";
  el("remaining").textContent = "--:--";
  el("seek").value = "0";
  setMessage("");
  persist();
  currentLabel();
  renderList();
}
async function playCurrent() {
  const audio = el("audio");
  if (!currentEpisode()) return;
  if (!audio.paused && audioReadyForId === currentId) { audio.pause(); return; }
  const episode = currentEpisode();
  if (audioReadyForId !== currentId) {
    audioReadyForId = currentId;
    audio.src = episode.audioUrl;
    audio.playbackRate = Number(el("speed").value);
    audio.load();
    audio.addEventListener("loadedmetadata", function restorePosition() {
      audio.removeEventListener("loadedmetadata", restorePosition);
      if (audioReadyForId !== currentId) return;
      const saved = episodeState(currentId);
      const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
      const position = saved.listened ? 0 : Math.min(Math.max(0, saved.position), Math.max(0, duration - 1));
      if (position > 0) audio.currentTime = position;
      updateTimeline();
    });
  }
  try { await audio.play(); setMessage(""); }
  catch { setMessage("Playback did not start. Tap Play to try again."); }
}
function chooseEpisode(id, startPlayback = false) {
  if (id !== currentId) selectEpisode(id);
  if (startPlayback) void playCurrent();
}
function moveEpisode(delta) {
  const index = episodes.findIndex(episode => episode.id === currentId);
  const target = episodes[index + delta];
  if (target) chooseEpisode(target.id, true);
}
function updateTimeline() {
  const audio = el("audio");
  const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
  const current = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
  el("elapsed").textContent = formatTime(current);
  el("remaining").textContent = duration ? `-${formatTime(duration - current)}` : "--:--";
  if (duration && !seeking) el("seek").value = String(Math.round(current / duration * 1000));
  const episode = currentEpisode();
  if (!episode || !duration || audioReadyForId !== currentId) return;
  if (saveTimer) return;
  saveTimer = window.setTimeout(() => {
    saveTimer = 0;
    const latest = el("audio");
    if (latest !== audio || currentId !== episode.id) return;
    const duration = Number.isFinite(latest.duration) ? latest.duration : 0;
    const wasListened = episodeState(episode.id).listened;
    const listened = wasListened || (duration > 0 && latest.currentTime / duration >= 0.9);
    updateEpisodeState(episode.id, { position: listened ? 0 : latest.currentTime, duration, listened });
    if (listened && !wasListened) { currentLabel(); renderList(); }
  }, 1000);
}
function onAudioState() {
  currentLabel();
  renderList();
}
function setFilter(nextFilter) {
  filter = nextFilter;
  for (const button of document.querySelectorAll(".filter")) {
    const active = button.dataset.filter === filter;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  }
  renderList();
}
function markListened() {
  const episode = currentEpisode();
  if (!episode) return;
  const listened = !episodeState(episode.id).listened;
  updateEpisodeState(episode.id, { listened, position: listened ? 0 : episodeState(episode.id).position });
  if (listened && episode.id === currentId && el("audio").paused) el("audio").currentTime = 0;
  currentLabel();
  renderList();
}
async function loadFeed() {
  el("episode-list").setAttribute("aria-busy", "true");
  el("feed-error").hidden = true;
  try {
    const response = await fetch("feed.xml", { cache: "no-cache" });
    if (!response.ok) throw new Error(`Feed request failed with ${response.status}`);
    episodes = parseFeed(await response.text(), document.baseURI);
    if (!episodes.length) throw new Error("Feed has no playable episodes.");
    currentId = episodes.some(episode => episode.id === state.currentId) ? state.currentId : episodes[0].id;
    el("episode-list").setAttribute("aria-busy", "false");
    persist();
    currentLabel();
    renderList();
  } catch (error) {
    el("episode-list").setAttribute("aria-busy", "false");
    el("feed-error").hidden = false;
    el("episode-list").replaceChildren();
    el("now-title").textContent = "Feed unavailable";
    el("play").disabled = true;
    el("mark-listened").disabled = true;
    setMessage(error instanceof Error ? error.message : "Could not load the feed.");
  }
}

if (typeof document !== "undefined" && document.getElementById("audio")) {
  el("speed").value = String(state.speed);
  el("speed").addEventListener("change", () => { el("audio").playbackRate = Number(el("speed").value); persist(); });
  el("play").addEventListener("click", () => void playCurrent());
  el("previous").addEventListener("click", () => moveEpisode(-1));
  el("next").addEventListener("click", () => moveEpisode(1));
  el("mark-listened").addEventListener("click", markListened);
  el("reload").addEventListener("click", () => void loadFeed());
  for (const button of document.querySelectorAll(".filter")) button.addEventListener("click", () => setFilter(button.dataset.filter));
  el("seek").addEventListener("input", () => { seeking = true; const audio = el("audio"); if (audio.duration) el("elapsed").textContent = formatTime(Number(el("seek").value) / 1000 * audio.duration); });
  el("seek").addEventListener("change", () => { const audio = el("audio"); if (audio.duration) audio.currentTime = Number(el("seek").value) / 1000 * audio.duration; seeking = false; updateTimeline(); });
  el("audio").addEventListener("timeupdate", updateTimeline);
  el("audio").addEventListener("loadedmetadata", updateTimeline);
  el("audio").addEventListener("play", onAudioState);
  el("audio").addEventListener("pause", onAudioState);
  el("audio").addEventListener("ended", () => {
    const episode = currentEpisode();
    if (episode) updateEpisodeState(episode.id, { listened: true, position: 0, duration: el("audio").duration || 0 });
    currentLabel(); renderList(); moveEpisode(1);
  });
  el("audio").addEventListener("error", () => { if (audioReadyForId === currentId) setMessage("This episode could not be loaded. Check your connection and try again."); });
  window.addEventListener("pagehide", () => {
    const audio = el("audio"); const episode = currentEpisode();
    if (episode && Number.isFinite(audio.currentTime) && audio.currentTime > 0) updateEpisodeState(episode.id, { position: audio.currentTime, duration: Number.isFinite(audio.duration) ? audio.duration : 0 });
  });
  void loadFeed();
}
