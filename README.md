# Morning AI Engineering Brief

A weekday, roughly three-minute audio brief for an engineering leader moving a company toward an AI-driven SDLC. It collects public RSS items, asks Gemini to select and script the most relevant developments, creates podcast-style narration, converts it to MP3, and publishes an RSS feed on GitHub Pages.

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

The script uses Gemini 3.5 Flash-Lite for the narration draft and Gemini 3.8 Flash TTS for higher-fidelity speech. Both currently list free API access; free-tier quotas and terms can change. The workflow uses GitHub Actions and Pages. The MP3 conversion uses FFmpeg on the GitHub runner.

## Tuning

Edit `FEEDS`, `PROMPT`, `LOOKBACK_HOURS`, `VOICE`, or the model constants in `brief.py`. The feed includes source links in each episode's show notes.
