# Wine Scanner App

A luxury wine list scanning experience built with Expo, Supabase, and Wine Labs AI. This repository runs the mobile/web React Native app plus the supporting tooling for ingesting wine lists, matching LWIN data, and displaying curated recommendations.

## Docs
- **Getting Started:** `docs/getting-started/` contains setup, deployment, and environment instructions.
- **Architecture:** `docs/architecture/` explains the project structure, database layout, and foundational logic.
- **Testing:** `docs/testing/` covers the test plans, automation, and web search experiments.
- **Reference:** `docs/reference/` stores the changelog, deep-dive features, and the legacy README with full project details.

## First Steps
1. Run `npm install` in `wine-scanner`.
2. Follow `docs/getting-started/SETUP.md` to configure Supabase and environment variables.
3. Launch the app with `npm run web`, `npm run ios`, or `npm run android`.

For the classic project overview, see `docs/reference/README.md`.

## Scripts
- `scripts/tests/` contains the manual helpers (`test-basic-gemini.js`, `test-chat-web-search.js`, etc.) you can run when you want to poke at the Wine Labs/Gemini/WebSearch sidecars outside the UI.
