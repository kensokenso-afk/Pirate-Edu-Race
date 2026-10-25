# Pirate-Edu-Race — AI Collaboration Rules

These rules apply to ChatGPT, Claude, GitHub Copilot, and human contributors.

## Before changing code
1. Read this file and `PROJECT.md`.
2. Inspect the relevant code before proposing or editing it.
3. Treat `ARCHITECTURE.md` as provisional until its open questions are verified against the code.
4. Do not assume `index.html` and `index (21).html` are interchangeable. Confirm which file is the canonical entry point before changing either.

## Task ownership
- Every task should have one primary implementer and explicit acceptance criteria in a GitHub Issue.
- Other agents should review or test the implementation rather than independently making overlapping edits.
- Report assumptions, files changed, tests run, and unresolved risks in the Pull Request.
- If a task overlaps with another active task, pause and coordinate before editing shared files.

## Git workflow
- Do not commit directly to `main`.
- Use a focused branch for each task.
- Open a Pull Request for review; do not merge your own change unless the project owner explicitly asks.
- Keep changes limited to the assigned task and avoid unrelated formatting or rewrites.
- Never overwrite or discard another contributor's changes.

## Quality and safety
- Preserve existing gameplay unless a change explicitly requires otherwise.
- Test on a mobile-sized viewport as well as desktop when UI is affected.
- For multiplayer changes, consider reconnects, duplicate events, latency, and inconsistent player state.
- Never commit API keys, passwords, private tokens, or other secrets.
- Do not claim tests passed unless they were actually run; state when tests could not be run.

## Pull Request checklist
- [ ] The change matches the Issue and its acceptance criteria.
- [ ] The relevant files and behavior are described.
- [ ] Tests or manual checks are documented.
- [ ] Potential regressions and remaining risks are noted.
- [ ] No unrelated files or secrets are included.
