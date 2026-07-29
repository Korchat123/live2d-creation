# Project pause handoff

Paused: 2026-07-29  
Branch: `main`  
Remote: `origin` (`Korchat123/live2d-creation`)

## Safe resume point

The latest pushed commit is:

`332acb6 Add private and deterministic audio-driven lip sync`

All commits through that point are pushed to GitHub. Commit messages use plain,
readable English.

## Completed work

- Phase 0 repository, security, planning, and CI foundation.
- Phase A specifications, rights validation, original reference artwork, and
  acceptance record.
- Phase B functional browser runtime slice, Pixi renderer, minimal avatar, and
  shared human/AI Studio controls.
- Phase B physical GPU and long-running performance evidence remains honestly
  pending.
- Phase C schema, trusted control routing, runtime SDK, secure bundle validator,
  and validated-bundle runtime loading.
- Phase D deterministic named animation-clip evaluation and private RMS/optional
  viseme lip-sync processing.

Recent pushed feature commits:

- `6bd1ce5 Add trusted controls and the reusable avatar runtime`
- `84f2920 Add secure avatar bundle validation before loading files`
- `37721e9 Load avatar assets only through validated bundles`
- `b9a99d3 Add deterministic named expression and motion clips`
- `332acb6 Add private and deterministic audio-driven lip sync`

The last complete repository CI run passed security and rights checks,
formatting, lint, type checks, 46 tests, and production builds. Later scoped
checks passed 9 core animation tests and 7 audio tests.

## Intentional uncommitted work

These Phase C delivery files are present but not committed:

- `.github/workflows/phase-c-package-check.yml`
- `docs/phase-status/phase-c.md`
- `live2d-model-plan.md`

They add a package-pack/clean-consumer workflow and Phase C status update. Review
before committing:

- replace the nonexistent workflow path `vitest.workspace.ts` with
  `vitest.config.ts`;
- include `@open-avatar/validator` in the clean-consumer import check;
- run the package workflow logic locally where practical;
- run full `corepack pnpm run ci`;
- commit with a readable message and push.

No first-party Phase D avatar asset edits were made before the pause.

## Remaining phases

1. Finish and push Phase C CI/CD evidence. Keep Phase C marked pending until its
   browser-matrix, coverage, and GitHub clean-consumer checks are evidenced.
2. Complete Phase D authored first-party expression/motion data, connect clips
   and audio output to the runtime, validate the avatar artifact, and add Phase D
   CI/CD.
3. Build Phase E Studio authoring, accessible controls, recording/replay,
   deterministic exporter, and its CI/CD.
4. Build Phase F AI/human examples, web component, playground, fallback tests,
   and its CI/CD.
5. Complete Phase G hardening and release-readiness metadata. Do not claim a
   production release until the license, signing credentials, physical browser
   performance, soak, and approval gates are resolved.

## Resume instruction

Start the next session with:

> Read `PAUSE_HANDOFF.md`, `live2d-model-plan.md`, and
> `subagent-work-plan.md`. Continue from the saved Phase C delivery work. Keep
> every task/feature in a separate readable-English commit, run its checks, and
> push it to `origin/main`. Preserve `.env` and secret exclusions.

Before editing, run `git status --short` and confirm the three intentional Phase
C files above are the only uncommitted changes.
