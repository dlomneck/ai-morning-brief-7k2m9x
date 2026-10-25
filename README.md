# Morning AI Engineering Brief

A weekday, editorially selective audio brief for an engineering leader moving a company toward an AI-driven SDLC. It collects public RSS items, asks Gemini whether the day has enough useful material, creates a conversational two-host episode when warranted, converts it to MP3, and publishes an RSS feed on GitHub Pages. Episodes aim for a commute-length listen when the news supports it; thin days are skipped and strong but limited news gets a shorter episode.

## Sources

The initial source set is deliberately focused on engineering practice, AI development tools, technical leadership, and high-signal community discussion:

- Pragmatic Engineer
- Latent Space
- Simon Willison
- GitHub Changelog
- Martin Fowler
- One Useful Thing
- AWS AI Blog
- OpenAI News (the model filters for engineering relevance)
- Addy Osmani
- Hacker News (official front-page feed; AI/SDLC relevance filtered by the editor)

The selector takes at most three recent items per source and spreads the input across sources before Gemini chooses what deserves airtime. Import AI was removed after repeated HTTP 403 responses; AWS AI Blog was added for Bedrock and applied-AI engineering coverage. OpenAI News adds another first-party signal, with strict filtering so model announcements only appear when they affect the SDLC. The custom Hacker News RSS service repeatedly returned 502, so it now uses Hacker News's official front-page RSS feed, with the editorial prompt filtering for AI/SDLC relevance. Tidy First, Lenny's Newsletter, and The Batch remain out to keep the signal focused.

## Public information and privacy

This repository and the podcast feed are public. Anyone with the feed URL can listen and download episodes. The script sends only public RSS titles, excerpts, and links to Gemini; do not add company information or private sources. Google's Gemini API free tier may use submitted content to improve its products.

## Setup

1. Create a Gemini API key in [Google AI Studio](https://aistudio.google.com/). Do not commit the key.
2. In this repository, open **Settings → Secrets and variables → Actions → New repository secret**. Name it `GEMINI_API_KEY` and paste the key into GitHub's secret form.
3. Under **Settings → Actions → General → Workflow permissions**, enable **Read and write permissions**.
4. Run **Actions → Daily AI Brief → Run workflow** once to verify the first episode.
5. After the first run creates the `gh-pages` branch, open **Settings → Pages** and choose **Deploy from a branch**, branch `gh-pages`, folder `/ (root)`.
6. The feed URL is `https://dlomneck.github.io/ai-morning-brief-7k2m9x/feed.xml`. Add it to Apple Podcasts or Overcast using “Add a Show by URL.”

The workflow is scheduled weekdays at 5:30 AM America/New_York, with daylight saving handled by GitHub's timezone-aware schedule. This gives the MP3 a buffer before a 6 AM commute, though GitHub can delay scheduled runs. It retains the latest 14 MP3 episodes. A public repository and public Pages site are required for this self-hosted feed.

The Monday run can consider recent weekend stories: the collector looks back up to 96 hours. Stories are marked as seen only if they are actually discussed in a published episode, so skipped-day and unmentioned candidates remain eligible during the lookback. Each Actions run includes a source-health table in its summary. A source must fail on three consecutive runs to trigger a GitHub email alert. The alert is sent once per outage; a successful fetch resets that source's counter. Source health counters are stored in `source-health.json` on the public Pages branch.

## Touch-first web player

The Pages home page is a large-control player designed for a landscape touchscreen. It reads episode titles, dates, descriptions, source links, and audio URLs from the same `feed.xml` used by podcast apps. Playback includes play/pause, previous/next, automatic next, seeking, and adjustable speed. The RSS feed remains available at `/feed.xml`.

Playback position, selected episode, speed, and listened status are stored only in the browser's local storage. They do not sync to another device, and clearing site data removes them. The player does not require an account and has no comment or shared-user feature. Audio is not preloaded before selection. Tesla browser behavior still needs an in-car check; the automated browser tests cannot verify car-specific controls or session behavior.

Player changes are tested with Vitest unit tests and Playwright integration/end-to-end browser tests. Run `npm ci`, `npx playwright install chromium`, then `npm test` locally. GitHub Actions runs the same checks on pushes and pull requests to `main`. After a player update, run **Actions → Publish player → Run workflow** to update Pages immediately; the next scheduled podcast run also republishes the latest player files.

## Models and costs

The script uses Gemini 3.5 Flash-Lite for editorial selection and dialogue scripting and Gemini 3.8 Flash TTS for two-speaker narration. The show notes link only the sources discussed in that episode. Cover art is published with the feed. Both currently list free API access; free-tier quotas and terms can change. The workflow uses GitHub Actions and Pages. MP3 conversion uses FFmpeg on the GitHub runner.

## Tuning

Edit `FEEDS`, `PROMPT`, `LOOKBACK_HOURS`, or the model constants in `brief.py`. The cover art is in `artwork.svg`; the workflow converts it to podcast-compatible PNG for the feed.
