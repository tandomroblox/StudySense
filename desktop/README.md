# StudySense for Windows

The Windows desktop wrapper opens the live StudySense workspace in an app window with an integrated tab strip for Overview, Planner, Exams, Syllabus, Learn, Library, and Time Guard. It uses a persistent app session so signing in once keeps the account available between launches.

## Build locally

Requires Node.js 22 or newer and Windows for the installer build.

```powershell
cd desktop
npm install
npm run dist:win
```

The installer is written to `desktop/dist/`. The app icon is generated from the StudySense brand SVG and embedded in the Windows installer and shortcuts.

## Current boundaries

This desktop release embeds the StudySense website; it does not yet monitor arbitrary native Windows applications. The Time Guard tab opens the existing StudySense Time Guard page. Website time tracking through the Chrome/Edge extension remains separate. The app requires an internet connection for the live workspace and account-backed features.
