# StudySense

StudySense is a student-first study dashboard for exam planning, chapter tracking, active recall, practice history, revision scheduling, AI study support, and a personal study library. The current platform is a Cloudflare Worker with static assets in `public/`, a D1 database, and an optional Chromium extension for local browser-time tracking.

## Web features

- Tasks, exams, per-exam chapters, and chapter progress.
- Curriculum catalogues for Classes 6–10. Exact editions and volume membership are kept explicit; unverified language lists are left empty rather than filled with guessed chapter titles.
- Smart revision scheduling based on a student's review rating.
- AI practice questions (MCQ, short-answer, numerical, or mixed) with optional student-provided lesson text.
- Readiness estimates that combine chapter status with recently recorded practice accuracy when it is available. This is a planning indicator, not an exam-mark prediction.
- A private study library for notes, formulas, definitions, and doubts organized by class, subject, textbook, part, and chapter.
- Focus timer, flashcards, practice logs, and a voluntary local CSV progress summary.
- Offline shell caching. API responses and account data are deliberately excluded from the service-worker cache.

Generated AI practice is original practice material, not a claim of official NCERT/CBSE questions. When textbook-specific accuracy matters, add the relevant lesson excerpt and verify generated material against the prescribed book and teacher's syllabus.

## Browser extension: Time Guard

The optional extension lives in `browser-extension/` and supports Chrome/Edge MV3-compatible browsers.

### Install locally

1. Download or clone the repository and extract it.
2. Open `chrome://extensions` in Chrome or `edge://extensions` in Microsoft Edge.
3. Enable **Developer mode**.
4. Select **Load unpacked** and choose the repository's `browser-extension` folder.
5. Open StudySense Time Guard from the browser toolbar, choose a tracking mode, and save your settings.

### Monitoring and screen-time controls

- **Restricted websites only**: records time for only the domains you select.
- **All websites — hostnames only**: an optional broader permission that records site hostnames, so daily and weekly most-used-site reports are useful even for websites that are not restricted. It does not collect page text, page titles, URLs' paths, search terms, form entries, or keystrokes.
- Only the explicit restricted-domain list counts toward the **15-minute allowance** and is blocked during a **35-minute cooldown**.
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
