# Storkly — Agent Instructions

## Git Workflow

- Commit after each granular sub-task (1A, 1B, …) — never batch unrelated changes
- Commit message format:

```
<PhaseId> - <Topic>: concise summary

<Implementation summary — what was built, key files, choices made, caveats.>

ADR-NNN: short decision summary (when applicable)

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

- Backend: run `./gradlew spotlessApply` before every commit
- Frontend: run `npx prettier --write src/` before every commit

## Architecture Decision Records

When you make an implementation choice not directly specified in `docs/ARCHITECTURE.md`
(library version, column type workaround, picking one valid approach over another):
- Create `docs/decisions/NNN-short-title.md`
- Add a line to `docs/DECISIONS.md`
- Reference it in the commit message

Do not skip this.

## Phase Discipline

Do not add features beyond the current phase. No OAuth buttons, scraper UI, or
Phase 2 features while working on Phase 1.
