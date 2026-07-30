# Project pause handoff

Paused: 2026-07-29  
Branch: `main`  
Remote: `origin` (`Korchat123/live2d-creation`)

## Safe resume point

The latest pushed commit is:

`75dbf0c Add Phase C package validation workflow`

All commits through that point are pushed to GitHub. Commit messages use plain,
readable English. The working tree may contain an in-progress browser/coverage
tooling change; preserve it unless the owning task confirms otherwise.

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
- Phase C package validation workflow: it packs the schema, core, controls,
  runtime, and validator packages; installs them through file-based overrides
  in a clean consumer fixture; imports their public entry points; and uploads
  commit-labeled, non-release archive artifacts.

Recent pushed feature commits:

- `6bd1ce5 Add trusted controls and the reusable avatar runtime`
- `84f2920 Add secure avatar bundle validation before loading files`
- `37721e9 Load avatar assets only through validated bundles`
- `b9a99d3 Add deterministic named expression and motion clips`
- `332acb6 Add private and deterministic audio-driven lip sync`

The last complete repository CI run passed security and rights checks,
formatting, lint, type checks, 46 tests, and production builds. Later scoped
checks passed 9 core animation tests and 7 audio tests.

## Current delivery state

The Phase C package-validation workflow and Phase C status update are committed
and pushed in `75dbf0c`. Local verification completed successfully:

- the exact clean-consumer workflow logic installed all five packed packages
  and imported their public entry points;
- `corepack pnpm run ci` passed safety and rights checks, formatting, lint,
  type checks, 57 tests, and production builds.

No first-party Phase D avatar asset edits were made before the pause.

## Remaining phases

1. Finish Phase C CI/CD evidence. Keep Phase C marked pending until its
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
> `subagent-work-plan.md`. Preserve any current in-progress browser/coverage
> tooling change, then complete the remaining Phase C gate evidence before
> beginning first-party Phase D asset work. Keep every task/feature in a
> separate readable-English commit, run its checks, and push it to
> `origin/main`. Preserve `.env` and secret exclusions.

Before editing, run `git status --short` and identify the owner and intent of
every uncommitted file.
