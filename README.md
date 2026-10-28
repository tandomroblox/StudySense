# StudySense

StudySense is a student-first study website for exam planning, chapter tracking, active recall, practice history, revision scheduling, AI study support, and a personal study library. It is organized into separate, linked pages that share one account and data model. The current platform is a Cloudflare Worker with static assets in `public/`, a D1 database, and an optional Chromium extension for local browser-time tracking.

## Website pages

- **Overview** (`/`): at-a-glance task completion, readiness, and suggested next steps.
- **Planner** (`/planner.html`): tasks, daily plan, focus timer, and entertainment allowance.
- **Exams** (`/exams.html`): upcoming exams and readiness.
- **Syllabus** (`/syllabus.html`): chapter catalogue/import, chapter status, and official curriculum sources.
- **Learn** (`/learn.html`): smart revision, AI practice, tutor, flashcards, and practice history.
- **Library** (`/library.html`): private notes, formulas, definitions, and doubts.
- **Profile & settings** (`/profile.html`): profile and study preferences, accessible from the top-right account menu.

The routes use `app-shell.html` and `app-shell.js` to mount one shared set of page elements, so navigation and account data stay consistent without duplicating the large HTML form tree. The view for each route displays only its own tools. The mobile navigation collapses into a horizontally scrollable row.

## Web features

- Tasks, exams, per-exam chapters, and chapter progress.
- Curriculum catalogues for Classes 6–10. Exact editions and volume membership are kept explicit; where a school may prescribe different language options, the page includes a note to confirm the booklist.
- Smart revision scheduling based on a student's review rating.
- AI practice questions (MCQ, short-answer, numerical, or mixed) with optional student-provided lesson text.
- Readiness estimates that combine chapter status with recently recorded practice accuracy when it is available. This is a planning indicator, not an exam-mark prediction.
- A private study library for notes, formulas, definitions, and doubts organized by class, subject, textbook, part, and chapter.
- Focus timer, flashcards, practice logs, and a voluntary local CSV progress summary.
- Offline shell caching for all seven routes and their shared layout. API responses and account data are deliberately excluded from the service-worker cache.

Generated AI practice is original practice material, not a claim of official NCERT/CBSE questions. When textbook-specific accuracy matters, add the relevant lesson excerpt and verify generated material against the prescribed book and teacher's syllabus.

## Browser extension: Time Guard

The optional extension lives in `browser-extension/` and supports Chrome/Edge MV3-compatible browsers.

### Install locally

The easiest route is to open the [Time Guard page](https://studysense.studysenseapp.workers.dev/time-guard.html) and download the latest packaged extension. The release ZIP contains only the extension files; extract it and choose the extracted folder containing `manifest.json`.

1. Download the [latest StudySense Time Guard ZIP](https://github.com/tandomroblox/StudySense/releases/latest/download/StudySense-Time-Guard.zip), then extract it.
2. Open `chrome://extensions` in Chrome or `edge://extensions` in Microsoft Edge.
3. Enable **Developer mode**.
4. Select **Load unpacked** and choose the extracted folder containing `manifest.json`.
5. Open StudySense Time Guard from the browser toolbar, choose a tracking mode, and save your settings.

The extension is manually installed as an unpacked Chromium extension; this is not a Chrome Web Store listing.

### Monitoring and screen-time controls

- **Restricted websites only**: starts with YouTube, Instagram, TikTok, Reddit, Facebook, X, Twitch, and Netflix flagged automatically; you can edit the list any time without per-site permission prompts.
- **All websites — hostnames only**: records hostnames for active browser tabs, so daily and weekly reports cover sites outside the restricted list. It does not collect page text, page titles, URL paths, search terms, form entries, or keystrokes; per-site access confirmations are not needed.
- Time is added cumulatively across the full restricted-domain list. Once combined active time reaches **15 minutes**, a focused break popup appears and those sites are blocked during a **35-minute cooldown**.
- Daily and seven-day totals, most-used-site lists, recent daily history, local CSV export, pause/resume, notification controls, and clear-history are available from the popup.
- Usage history is stored in the browser profile and retained for up to 90 days. It is not uploaded to the StudySense website or D1.
- Time is estimated from the active tab while the browser window is focused. Browser alarm throttling, sleep, crashes, and switching devices can make estimates imperfect.
- This extension cannot monitor native desktop apps, other browsers, or a device when the extension is disabled or removed. It is a self-management aid, not tamper-proof parental-control software. Incognito monitoring is not enabled by default.
- Host permissions are optional. Selecting all-site monitoring triggers a broad host-permission request; users should choose that mode only if they understand and agree to it.

## Development checks

Node.js 22 or later is recommended.

```sh
node --check public/script.js
node --check public/syllabus.js
node --check public/sw.js
node --check public/study-tools.js
node --check browser-extension/background.js
node --check browser-extension/popup.js
node --input-type=module --check < src/index.js
node scripts/check-quality.mjs
node --test tests/*.test.mjs
```

The GitHub Actions workflow runs syntax checks, static configuration checks, syllabus-volume regression tests, and extension time-accounting tests on pushes and pull requests.

## Cloudflare schema and deployment

- Worker: `studysense`
- Static assets directory: `public/`
- D1 binding: `DB`
- Workers AI binding: `AI`
- Migration files live under `migrations/`.

Apply schema changes deliberately to the intended database after reviewing the migration:

```sh
npx wrangler d1 migrations apply studysense-db --remote
```

Migration `0006_revision_library.sql` adds only tables and indexes for revision scheduling and the study library. It does not delete or rewrite existing study records. In the connected production D1 database for this deployment, the `user_profiles` table and the `0002`–`0006` migration records have been verified. For a different environment, inspect its current schema and migration history before applying pending migrations; do not blindly reapply production changes.

This repository does not contain a configured Cloudflare deployment workflow with credentials. A passing GitHub check or a merged commit alone does **not** prove that a new Worker version or its static assets are live. Verify the Worker version, public HTTP response, sign-in, D1 operations, AI calls, and offline shell after a deployment.

## Data and safety notes

- App API requests require a signed-in session and account-scoped database access.
- Session secrets and Google OAuth secrets belong in Cloudflare secret bindings, never in committed source files.
- Parents receive no automatic access to private study content. The student explicitly downloads and shares the progress summary.
- Curriculum lists can vary by language, school, edition, and updated NCERT notices. Check the textbook title, exact part, edition, and school syllabus before relying on an imported list.
