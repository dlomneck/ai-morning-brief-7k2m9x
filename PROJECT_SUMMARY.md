# AI Morning Brief — Project Summary

This document summarizes the public, reusable design of the automated audio-brief project. It contains no listener name, employer name, NAS hostname, NAS address, port, credentials, or private source links.

## Objective

Produce a selective daily audio briefing about developments that can materially affect AI-enabled software delivery and engineering leadership. The output should sound like a relaxed, upbeat two-host podcast, cite sources casually in the narration, and provide links to the discussed sources in the show notes.

The episode should be as long as the useful material warrants. A commute-length episode is a target when there is enough substance; quiet news days should be skipped, and limited but useful news should make a shorter episode.

## Current implementation

- `brief.py` collects recent public RSS items, spreads selection across sources, filters them for relevance with Gemini, and skips publication when there is not enough useful news.
- When an episode is warranted, Gemini writes a two-host dialogue and generates speech audio. FFmpeg converts the audio to MP3.
- The GitHub Actions workflow runs daily at 5:30 a.m. Eastern and can also be started manually.
- The workflow publishes the podcast feed, cover art, landing page, and recent MP3 episodes to the `gh-pages` branch through GitHub Pages.
- The feed retains up to 14 recent episodes. The GitHub Actions secret contains the Gemini API key; secrets are not committed to the repository.
- Each Actions run includes a source-health table with feed status, recent-item count, and consecutive failures. A source must fail on three consecutive runs before the workflow sends an email alert.
- Alerts fire once per outage. A successful fetch clears that source's failure streak and allows a future outage to trigger a new alert.
- The failure counters are stored in `source-health.json` on the public Pages branch. They contain only source names and health status; no credentials or NAS details.

## Editorial focus

Prioritize coding agents, AI-assisted QA, developer workflows and tooling, engineering practices, team design, security, and governance. Include model or harness updates only when they have a practical effect on software delivery. Prefer evidence and concrete implications over hype. Do not invent facts or company-specific knowledge.

## Source set

The configured sources are Pragmatic Engineer, Latent Space, Simon Willison, GitHub Changelog, Martin Fowler, One Useful Thing, AWS AI Blog, OpenAI News, Addy Osmani, and Hacker News. The selector limits the number of items per source and the editorial prompt decides what merits an episode. Source configuration lives in `brief.py`.

## Public-data and privacy boundary

The repository and podcast feed are public. Only public feed titles, excerpts, and links should be sent to the model APIs. Do not add internal company material, private RSS feeds, credentials, NAS connection details, or identifying listener information to repository files or generated episodes. Keep API credentials in GitHub Actions Secrets.

The public repository contains implementation details needed to operate the brief. This summary intentionally omits personal and infrastructure identifiers.