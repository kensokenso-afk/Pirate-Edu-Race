# Architecture Notes

This document is an initial map for contributors, not a verified architecture specification. Confirm details against the full source before relying on them.

## Known from the repository
- The app includes a large HTML page with embedded CSS and likely JavaScript.
- The document language is Indonesian.
- The page title is `PIRATE EDU-RACE — Tantang Laut, Raih Ilmu!`.
- Tailwind CSS browser CDN is referenced, with a local fallback stylesheet intended for when the CDN fails.
- Google Fonts is referenced for the pixel-style `Press Start 2P` typeface.
- Two similarly named HTML files exist: `index.html` and `index (21).html`.

## Areas to map during the next code review
1. **Entry point and deployment:** identify which HTML file is served in production.
2. **UI and screens:** map the start/lobby/game/results screens and their DOM IDs.
3. **Game state:** identify the main state variables and transitions.
4. **Questions and scoring:** locate question data, answer validation, scoring, and race progress.
5. **Multiplayer:** identify the transport/backend, room lifecycle, player identity, synchronization, and reconnect handling.
6. **Persistence:** identify whether settings, progress, or scores are stored locally or remotely.
7. **Dependencies:** record external scripts, fonts, services, and any required environment configuration.
8. **Testing and release:** document manual test steps, automated tests if present, and deployment procedure.

## Rules for architecture changes
- Avoid splitting the single-page app into multiple modules as part of an unrelated feature.
- Do not introduce a new framework or dependency without explaining the benefit and migration impact.
- Do not put secrets in client-side HTML or commit them to the repository.
- For changes to multiplayer state, describe which side is authoritative and how conflicting updates are handled.

## Update process
After inspecting the full source and deployment settings, replace unknowns with verified facts. Keep a short note of the files or configuration that support important architectural decisions.
