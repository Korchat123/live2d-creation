# Phase A Gate Review

Status: accepted  
Date: 2026-07-29

## Accepted baseline

- Original character sheet, turnaround, and layer breakdown are stored under
  `assets/source/reference-avatar/`.
- The rights manifest validates and reports `exportEligible: true`.
- The approved art canvas is 2048 x 2048 logical pixels.
- Runtime textures are limited to two 2048 x 2048 atlases and 32 MiB decoded
  memory for the first-party avatar.
- The compressed first-party bundle target is 5 MiB.
- V1 lip sync uses RMS-derived mouth openness. Visemes remain an optional later
  capability.
- Expressions, motions, gaze, blink, mouth, pose, interruption, reset, reduced
  motion, and shared human/AI control have traceable acceptance requirements.
- CI validates repository safety, asset rights, requirements traceability,
  formatting, lint, types, tests, and builds.

## Evidence

- `docs/authoring/visual-spec.md`
- `docs/authoring/layer-spec.md`
- `docs/authoring/acceptance-checklist.md`
- `docs/protocol/capabilities.md`
- `assets/reference-avatar/LICENSES/rights.json`
- `assets/source/reference-avatar/character-sheet.svg`
- `assets/source/reference-avatar/turnaround.svg`
- `assets/source/reference-avatar/layer-breakdown.svg`

## Approval basis

The project owner authorized autonomous execution and project decisions on
2026-07-29. This approval accepts the original reference design and measurable
technical defaults for the Phase B spike. It does not authorize adding
unrecorded third-party assets or weakening any rights, privacy, or security
gate.
