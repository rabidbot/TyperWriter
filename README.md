# Paperbound

Paperbound is a minimalist mechanical typewriter word processor prototype. It is built with React and Vite, with the writing surface designed to run equally well in a browser or inside a future Electron/Tauri shell.

## Run locally

```sh
npm install
npm run dev
```

## Publish a desktop release

Run `npm run release` from a clean `main` checkout. This increments the patch version, creates a matching `v*.*.*` tag, and pushes both the commit and tag. GitHub Actions then builds the Windows installer/portable executable and macOS DMG/ZIP and publishes them to GitHub Releases.

## Included

- Vertical active-line centering while writing
- Local draft recovery and autosave indicator
- Plain text, Markdown, and RTF export
- Native browser spellcheck
- Optional synthesized key feedback
- Paper texture, typewriter typography, dark mode, and responsive layout
