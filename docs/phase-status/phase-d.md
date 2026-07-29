# Phase D status

Status: authored animation and runtime integration in progress
Reviewed: 2026-07-29

## Implemented evidence

- First-party expression and motion clips define every required semantic ID.
- The runtime evaluates declared clips deterministically while live mouth input
  remains the final owner of the mouth channel.
- Studio actions submit declared expression and motion IDs through the shared
  control path.
- Parameter sweeps verify every authored clip remains within its declared
  bounds at 20 ms samples.
- A reviewed Chromium golden image covers the first-party fixture under gaze
  and mouth control, and its asset-count, byte-size, and canvas budgets are
  enforced in CI.
- The public validator accepts the fixture manifest and every declared layer.
- Phase D CI runs rights validation and the core, audio, and runtime suites,
  then stores the authored inputs as a non-release artifact.

## Remaining gate work

- Approve the separated first-party render layers. The fixture rig now covers
  head/body pose, gaze, blink, brows, and mouth; optional physics is deferred.
- Add golden renders and visual inspection evidence for every authored clip.
- Establish GPU-memory budgets for approved production texture inputs.
- Publish a validated first-party avatar bundle only after those inputs and
  approvals are complete.

The authored-input artifact is not a release artifact and does not represent a
completed first-party avatar bundle.
