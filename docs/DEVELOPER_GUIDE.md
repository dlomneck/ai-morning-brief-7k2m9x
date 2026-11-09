# Developer guide: Morning AI Engineering Brief

This guide explains how the project works from source code to the podcast you can play. It assumes you are new to GitHub and GitHub Actions.

## What this project does

On weekday mornings, the project checks public RSS feeds for recent AI and software-engineering stories. It selects a small set of candidates, asks Gemini whether they are important enough for an episode, writes a two-host script, generates speech, converts it to MP3, and publishes the episode.

The same published site also contains a touchscreen-friendly web player. Podcast apps use the RSS feed; the player reads that same feed and plays the same MP3 files.

A quiet news day may produce no episode. That is an intended result, not necessarily a failure.

## The two important Git branches

A **branch** is a named line of versions of a project. This repository uses two branches for different purposes:

- **`main` is the source code.** Python scripts, player files, tests, workflows, and documentation live here. Code changes should start here.
- **`gh-pages` is the published site.** It contains generated files such as `feed.xml`, MP3s, artwork, and the ready-to-use player. GitHub Pages serves this branch to visitors.

Think of `main` as the recipe and `gh-pages` as the finished meal. The publishing workflows rebuild or update the finished site from the recipe and the latest episode data.

The `gh-pages` branch is generated output. Avoid editing it by hand: a later publishing run can replace its contents.

## How the morning episode is made

The workflow is configured in [daily-brief.yml](../.github/workflows/daily-brief.yml). A **workflow** is an automated sequence of steps. GitHub runs this one on a temporary Linux computer called a **runner**.

The current schedule is weekdays at **1:17 a.m. America/New_York**. GitHub can delay a scheduled job, so this is a target time rather than a guaranteed finish time. You can also start it manually from the repository's **Actions** tab.

The steps are:

1. **Get the source.** GitHub checks out the latest code from `main`.
2. **Install audio tools.** The runner installs FFmpeg (to encode MP3 audio) and librsvg (to turn the SVG cover image into a PNG).
3. **Load the existing site.** The workflow downloads `gh-pages` into a temporary `site` directory. This preserves the existing feed, episodes, seen-story records, and source-health records.
4. **Read the news feeds.** [brief.py](../brief.py) fetches the RSS or Atom feeds listed in its `FEEDS` setting. It tries to consider items from the last 96 hours. Failed sources are recorded, while working sources can still provide candidates.
5. **Choose candidates fairly.** The collector removes duplicate links and titles, then selects up to 20 candidates, with no more than three from one source. This round-robin approach keeps a high-volume source from filling the whole candidate list.
6. **Make the editorial decision.** Gemini receives public titles, excerpts, dates, publication names, and links. It can decide to skip the episode. If it publishes, it returns a specific title, a conversation between Alex and Jordan, and the IDs of the sources it used. The prompt focuses on coding agents, QA, engineering workflow and tooling, practices, team design, security, and governance.
7. **Generate audio.** The text-to-speech service creates the two voices. FFmpeg makes the MP3 and applies a 1.1x tempo filter. The text model uses a fallback model only if the primary text request ultimately returns HTTP 503.
8. **Update the feed and site.** The script adds the transcript and source links to the RSS item, adds the MP3 enclosure, updates the seen-story records, and keeps up to 60 recent episodes. Older MP3s no longer in that retained set are removed.
9. **Add the web player.** The workflow copies the player files from `main` into the site and adds the source commit ID to the JavaScript and CSS URLs. That URL version helps browsers notice new player code.
10. **Publish.** The runner pushes the updated site to `gh-pages`. GitHub Pages then makes the files available on the public website.

Only stories the generated episode says it actually discussed are marked as seen. If a day is skipped, those candidate stories remain eligible during the lookback period. The `seen.json` file prevents already-used stories from filling later episodes, and old seen records are eventually discarded.

### What “skip” means

There are two normal skip cases:

- No eligible new stories were found.
- Gemini decided the available stories did not merit an episode.

The workflow can still finish successfully in either case. Check the run's logs and summary to distinguish a deliberate skip from an error. A successful run means the automation completed; it does not mean an MP3 was necessarily created.

## How the web player works

The player source is in [player/index.html](../player/index.html), [player/player.css](../player/player.css), and [player/player.js](../player/player.js).

- The HTML defines the controls and page structure.
- The CSS controls the touch-first layout and appearance.
- The JavaScript fetches `feed.xml`, builds the episode list, and controls the browser's built-in audio player.
- Each list item has two separate actions: the round Play button starts that episode; the rest of the row expands or collapses its transcript and sources.
- Playback supports pause, previous/next, automatic next, seeking, playback speed, and marking one or all episodes played.

Listening state is saved in that browser's local storage. It includes the selected episode, playback position, speed, and listened status. It does not sync to another device and is lost if that browser's site data is cleared. There is no server-side account, login, or comments feature.

The player uses standard browser audio. Automated tests can check desktop browser behavior, but they cannot prove that every Tesla browser or every future car software version will behave the same way.

## How code changes get to the live site

A **commit** is a saved version of code in GitHub. A push adds a commit to a branch. This project has two relevant automation paths:

### Player code changes

1. Change files in `player/` on `main`.
2. When a commit is pushed to `main`, **Player checks** runs automatically. It is configured in [player-checks.yml](../.github/workflows/player-checks.yml).
3. The checks install dependencies and Chromium, then run the tests. A green result means the tests passed for that commit; a red result means at least one step failed. Open the run to see the failing step and its log.
4. To publish a player change immediately, open **Actions → Publish player → Run workflow**. That workflow copies the player files from `main` to `gh-pages`.
5. GitHub Pages publishes the changed branch. It can take a little while to become visible. Refresh the page if your browser still has the older version.

The daily brief workflow also copies the current player files whenever it publishes the site. So an immediate manual publish is useful after a player change; it is not required every day just to keep the player available.

### Podcast-content changes

The **Daily AI Brief** workflow runs on its schedule or when you start it manually. It generates or skips an episode, updates the RSS feed and audio files, copies the player, and publishes the result to `gh-pages`.

A change to documentation alone does not change the player or podcast and does not need a Pages deployment. The docs live on `main` and can be read in GitHub.

### Recommended GitHub workflow for a code change

For a small personal project, it is possible to commit directly to `main`. A safer habit is:

1. Start a short-lived branch for one change.
2. Make the change and run the relevant checks.
3. Open a **pull request**. This is a review page showing the proposed changes before they become part of `main`.
4. Wait for Player checks to finish, review the changes, then merge the pull request.
5. Publish the player if the change affects player files.

A branch and pull request do not make a second source of truth: GitHub still holds the code and its history. A local VS Code folder is just a working copy. Changes there are not in GitHub until they are pushed.

## Tests and what they cover

Player tests use Vitest and Playwright:

- **Unit tests** check small pieces such as RSS parsing, safe handling of descriptions, local-state storage, and time formatting.
- **Integration tests** open the player in a browser and check connected behavior such as playing an episode and expanding its notes.
- **End-to-end tests** exercise larger user flows and responsive layouts in Chromium.

On your own computer, from the repository folder:

```sh
npm ci
npx playwright install chromium
npm test
```

The same test command runs automatically in GitHub Actions for pushes and pull requests to `main`. The daily Python episode-generation pipeline does not have the same level of automated test coverage. Running it can contact external services and consume API quota, so do not treat `npm test` as a test of RSS providers, Gemini, text-to-speech, MP3 encoding, Apple Podcasts, or Tesla playback.

The separate LinkedIn email feature has its own Python unit tests. It is not part of the podcast publication path.

## GitHub Actions, permissions, and secrets

A **secret** is a credential stored by GitHub and supplied to a workflow while it runs. The daily workflow needs the repository secret `GEMINI_API_KEY`; the source code does not contain the key. Never paste keys into source files, documentation, a commit, or an Actions input.

The daily-brief and Publish player workflows need `contents: write` permission so their runner can update `gh-pages`. Player checks only need `contents: read`. GitHub also supplies a temporary `GITHUB_TOKEN` to workflows; the project uses it to push generated site files.

The repository and Pages site are public. The feed, MP3s, episode transcripts, source links, and source-health counts can be viewed or downloaded by anyone. Only public story material should go to the model. Do not add internal company documents, private feed URLs, credentials, or NAS details.

Free model quotas and provider terms can change. Free-tier availability is not a promise of unlimited or permanently free service. A scheduled run can fail because a source is unavailable, an API quota or model changes, network access fails, or an external service changes its behavior.

## Where to look when something goes wrong

1. Open the repository's **Actions** tab.
2. Open the newest **Daily AI Brief** run.
3. Read the step list. A red X identifies a failed step; open it to see the log.
4. Look for the **RSS source health** table in the run summary. It reports each feed's status and recent-item count.
5. A source must fail three consecutive runs before the workflow marks a persistent source failure. GitHub notification emails depend on your GitHub notification settings.
6. If the run is green but there is no new episode, read the output for “No fresh items” or “NO EPISODE”; those are editorial skip outcomes.
7. If a player change was published but still looks old, check the **Publish player** run and the Pages deployment run, then refresh the site.

For a manual episode run, use **Actions → Daily AI Brief → Run workflow** and select `main`. The optional `redo_story_links` input accepts a JSON array of exact story URLs, such as:

```json
["https://publisher.example/story"]
```

A requested story must still be available in the feed lookback window. Use this carefully: intentionally regenerating a story can create another episode.

## Project files at a glance

| File or folder | What it does |
|---|---|
| `brief.py` | RSS collection, candidate selection, Gemini editorial decision, script/audio generation, feed and retention updates |
| `player/` | Source files for the touchscreen web player |
| `linkedin_weekly.py` | Separate optional weekly LinkedIn draft and email feature |
| `.github/workflows/daily-brief.yml` | Scheduled/manual podcast-generation pipeline |
| `.github/workflows/publish-player.yml` | Manual player-only publication |
| `.github/workflows/player-checks.yml` | Automated player tests on pushes and pull requests |
| `tests/` | Player tests, fixtures, and LinkedIn feature tests |
| `artwork.svg` | Source cover art; converted to PNG for the podcast feed |
| `README.md` | User-facing setup and operational notes |
| `PROJECT_SUMMARY.md` | Short overview and privacy boundary |

## Common GitHub words

- **Repository:** The project's home on GitHub: code, docs, history, and automation.
- **Commit:** A saved snapshot of changes, with a message describing what changed.
- **Branch:** A named line of commits, such as `main` or `gh-pages`.
- **Push:** Sending commits from a working copy or tool to GitHub.
- **Workflow:** A YAML file that tells GitHub Actions what steps to run.
- **Runner:** The temporary computer that runs those steps.
- **GitHub Pages:** GitHub's static website hosting for files in a repository.
- **RSS feed:** A machine-readable list of episodes that podcast apps can follow.
