# Pirate-Edu-Race — Project Context

## Project at a glance
- **Name:** Pirate-Edu-Race
- **Type:** Browser-based multiplayer educational game
- **Primary language visible in the repository:** HTML (with embedded CSS and JavaScript)
- **User-facing language:** Indonesian (`<html lang="id">`)
- **Current repository:** `kensokenso-afk/Pirate-Edu-Race`
- **Default branch:** `main`

## Current repository observations
The repository currently contains:
- `index.html` — a large HTML file that appears to contain the game UI and application code.
- `index (21).html` — another large HTML file with a very similar opening structure.
- `README.md` — currently only identifies the project.

**Important:** The canonical game entry point, the reason for the second HTML file, and the exact multiplayer backend/service have not yet been confirmed. Do not delete, rename, or treat either HTML file as a duplicate until their differences and deployment configuration are checked.

## Product direction
The project name and current page title indicate an educational racing game with a pirate theme. Keep the experience:
- Understandable for Indonesian-speaking players.
- Usable on mobile screens and desktop.
- Accessible to keyboard, touch, and zoom where practical.
- Stable during multiplayer play.

Treat these as guiding goals, not proof that every feature is already implemented.

## Development principles
1. Prefer small, reviewable changes over full-file rewrites.
2. Preserve existing game behavior unless the task specifically changes it.
3. Check existing patterns and dependencies before adding libraries.
4. For UI changes, test a narrow mobile viewport and a desktop viewport.
5. For multiplayer work, explicitly consider synchronization, reconnects, duplicate actions, and error states.
6. Update this document when confirmed project facts or product decisions change.

## Questions to confirm
- Which HTML file is the production/canonical entry point?
- How is multiplayer implemented (for example, which backend or realtime service)?
- Where is the game deployed, and what build/test steps are used?
- What are the core game loop, supported player count, and educational question flow?
