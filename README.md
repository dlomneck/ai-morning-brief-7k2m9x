# Morning AI Engineering Brief

A weekday, editorially selective audio brief for an engineering leader moving a company toward an AI-driven SDLC. It collects public RSS items, asks Gemini whether the day has enough useful material, creates a conversational two-host episode when warranted, converts it to MP3, and publishes an RSS feed on GitHub Pages. Episodes aim for a commute-length listen when the news supports it; thin days are skipped and strong but limited news gets a shorter episode.

New to the code or GitHub Actions? Start with the [developer guide](docs/DEVELOPER_GUIDE.md).

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
- OpenAI Developer Blog (Codex and developer-workflow coverage)
- InfoQ AI Development
- Google Cloud DevOps and SRE (including DORA research)
- OWASP GenAI Security Project (AI application security and governance)
- Addy Osmani
- Hacker News (official front-page feed; AI/SDLC relevance filtered by the editor)

The selector takes at most three recent items per source and spreads the input across sources before Gemini chooses what deserves airtime. Import AI was removed after repeated HTTP 403 responses; AWS AI Blog was added for Bedrock and applied-AI engineering coverage. OpenAI News adds a first-party signal for releases, while the Developer Blog adds Codex and hands-on developer-workflow coverage; both are filtered for practical SDLC impact. InfoQ AI Development adds practitioner coverage of AI-assisted software development; Google Cloud DevOps and SRE adds software delivery and DORA research; OWASP GenAI adds security and governance guidance. The custom Hacker News RSS service repeatedly returned 502, so it now uses Hacker News's official front-page RSS feed, with the editorial prompt filtering for AI/SDLC relevance. Tidy First, Lenny's Newsletter, and The Batch remain out to keep the signal focused.

## Editorial approach

The brief filters aggressively for relevance, then explores selected stories in a conversational two-host discussion. Hosts ask real follow-up questions, explain why a development matters, unpack implications and uncertainty, and use clearly labeled hypothetical examples when they help. The target is about 15 minutes when the material supports it; a quiet day can be shorter or skipped, with no padding.

## Public information and privacy

This repository and the podcast feed are public. Anyone with the feed URL can listen and download episodes. Podcast generation sends public RSS titles, excerpts, and links to Gemini. The optional GitHub LinkedIn draft workflow uses Gemini and is manual-only. The recurring LinkedIn draft is managed separately in ChatGPT Scheduled. Use only public material; do not add company information or private sources. Provider terms and data controls apply to submitted content.

## Setup

1. Create a Gemini API key in [Google AI Studio](https://aistudio.google.com/). Do not commit the key.
2. In this repository, open **Settings → Secrets and variables → Actions → New repository secret**. Name it `GEMINI_API_KEY` and paste the key into GitHub's secret form.
3. Under **Settings → Actions → General → Workflow permissions**, enable **Read and write permissions**.
4. Run **Actions → Daily AI Brief → Run workflow** once to verify the first episode. To regenerate a prior episode in a different format, optionally provide a JSON array of its exact RSS story URLs in `redo_story_links`; those items must still be inside the 96-hour feed lookback window.
5. After the first run creates the `gh-pages` branch, open **Settings → Pages** and choose **Deploy from a branch**, branch `gh-pages`, folder `/ (root)`.
6. The feed URL is `https://dlomneck.github.io/ai-morning-brief-7k2m9x/feed.xml`. Add it to Apple Podcasts or Overcast using “Add a Show by URL.”

The podcast workflow is scheduled weekdays at 10:17 PM America/New_York, with an 11:17 PM backup. The backup skips if that day's episode is already published. GitHub can delay scheduled runs, so these times are targets rather than guaranteed finish times. It retains the latest 60 MP3 episodes. A public repository and public Pages site are required for this self-hosted feed.

The Monday run can consider recent weekend stories: the collector looks back up to 96 hours. Stories are marked as seen only if they are actually discussed in a published episode, so skipped-day and unmentioned candidates remain eligible during the lookback. Each Actions run includes a source-health table in its summary. A source must fail on three consecutive runs to trigger a workflow failure alert, sent once per outage. GitHub email delivery depends on your notification settings; a successful fetch resets that source's counter. Source health counters are stored in `source-health.json` on the public Pages branch.

## Touch-first web player

The Pages home page is a large-control player designed for a landscape touchscreen. It reads episode titles, dates, descriptions, source links, and audio URLs from the same `feed.xml` used by podcast apps. Playback includes play/pause, previous/next, automatic next, seeking, and adjustable speed. The RSS feed remains available at `/feed.xml`.

Playback position, selected episode, speed, and listened status are stored only in the browser's local storage. They do not sync to another device, and clearing site data removes them. The player does not require an account and has no comment or shared-user feature. Audio is not preloaded before selection. Tesla browser behavior still needs an in-car check; the automated browser tests cannot verify car-specific controls or session behavior.

Player changes are tested with Vitest unit tests and Playwright integration/end-to-end browser tests. Run `npm ci`, `npx playwright install chromium`, then `npm test` locally. GitHub Actions runs the same checks on pushes and pull requests to `main`. After a player update, run **Actions → Publish player → Run workflow** to update Pages immediately; the next scheduled podcast run also republishes the latest player files.

## Models and costs

The podcast generator uses Gemini models for editorial selection, dialogue scripting, and two-speaker narration. Alex and Jordan have distinct delivery styles, with stronger energy reserved for turns about unusually consequential developments. FFmpeg applies a pitch-preserving 1.1× tempo increase to the finished audio. The show notes link only the sources discussed in that episode. Cover art is published with the feed. The optional GitHub LinkedIn workflow uses Gemini. The recurring ChatGPT Scheduled task is managed separately and does not use the GitHub workflow. The workflows use GitHub Actions and Pages.

## Tuning

Edit `FEEDS`, `PROMPT`, `LOOKBACK_HOURS`, or the model constants in `brief.py`. The cover art is in `artwork.svg`; the workflow converts it to podcast-compatible PNG for the feed.

## Weekly LinkedIn draft

The recurring LinkedIn draft is managed by the separate ChatGPT Scheduled task. It reviews the approved public sources, writes one short draft for your review, and returns source links. It does not publish to LinkedIn.

The GitHub workflow remains available for manual use only. It uses Gemini and can email a draft if you select `send_email`. It requires the `GEMINI_API_KEY` secret and `LINKEDIN_FREE_TIER_CONFIRMED=true` repository variable. The workflow has no schedule trigger. SMTP settings are needed only when you choose email delivery.

Generated copy should be reviewed before posting. Neither workflow publishes directly to LinkedIn.

### Gmail sender

Use `smtp.gmail.com` for `SMTP_HOST`; the script connects with verified TLS on port 465. Set `SMTP_USER` and `SMTP_FROM` to the sending Gmail address, and `LINKEDIN_EMAIL_TO` to the inbox receiving the drafts (it can be the same address). Set `SMTP_PASSWORD` to a Google app password, not the normal account password. Google requires 2-Step Verification for app passwords; account policies or Advanced Protection may prevent their use. Create a dedicated app password named for this workflow and enter it directly in GitHub Secrets. If app passwords are unavailable, use an OAuth implementation instead; do not weaken account security.

Google instructions: https://support.google.com/mail/answer/185833

Multiple draft recipients: set `LINKEDIN_EMAIL_TO` to plain addresses separated by commas or semicolons, for example `one@example.com; two@example.com`. Both recipients appear in the To header and can see each other’s addresses. Empty entries and malformed addresses are rejected before generation. Update this value directly in GitHub Secrets, not source code.
