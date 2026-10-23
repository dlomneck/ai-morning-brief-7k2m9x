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
- Import AI
- Addy Osmani
- Hacker News (AI agents and coding agents; 100-point minimum)

The selector takes at most three recent items per source and spreads the input across sources before Gemini chooses what deserves airtime. Tidy First and Lenny's Newsletter are left out of the first run because they are less consistently focused on AI-driven SDLC; The Batch is also held back to limit broad AI news overlap. Add them later if the first week shows a meaningful gap.

## Public information and privacy

This repository and the podcast feed are public. Anyone with the feed URL can listen and download episodes. The script sends only public RSS titles, excerpts, and links to Gemini; do not add company information or private sources. Google's Gemini API free tier may use submitted content to improve its products.

## Setup

1. Create a Gemini API key in [Google AI Studio](https://aistudio.google.com/). Do not commit the key.
2. In this repository, open **Settings → Secrets and variables → Actions → New repository secret**. Name it `GEMINI_API_KEY` and paste the key into GitHub's secret form.
3. Under **Settings → Actions → General → Workflow permissions**, enable **Read and write permissions**.
4. Run **Actions → Daily AI Brief → Run workflow** once to verify the first episode.
5. After the first run creates the `gh-pages` branch, open **Settings → Pages** and choose **Deploy from a branch**, branch `gh-pages`, folder `/ (root)`.
6. The feed URL is `https://dlomneck.github.io/ai-morning-brief-7k2m9x/feed.xml`. Add it to Apple Podcasts or Overcast using “Add a Show by URL.”

The workflow runs weekdays at 09:30 UTC. GitHub can delay scheduled runs. It retains the latest 14 MP3 episodes. A public repository and public Pages site are required for this self-hosted feed.

## Models and costs

The script uses Gemini 3.5 Flash-Lite for editorial selection and dialogue scripting and Gemini 3.8 Flash TTS for two-speaker narration. The show notes link only the sources discussed in that episode. Cover art is published with the feed. Both currently list free API access; free-tier quotas and terms can change. The workflow uses GitHub Actions and Pages. MP3 conversion uses FFmpeg on the GitHub runner.

## Tuning

Edit `FEEDS`, `PROMPT`, `LOOKBACK_HOURS`, or the model constants in `brief.py`. The cover art is in `artwork.svg`; the workflow converts it to podcast-compatible PNG for the feed.
