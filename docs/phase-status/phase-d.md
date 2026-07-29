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
- Phase D CI runs rights validation and the core, audio, and runtime suites,
  then stores the authored inputs as a non-release artifact.

## Remaining gate work

- Produce and validate separated first-party render layers and the full rig.
- Add golden renders and visual inspection evidence for every clip.
- Establish and enforce first-party asset size and GPU-memory budgets.
- Publish a validated first-party avatar bundle only after those inputs and
  approvals are complete.

The authored-input artifact is not a release artifact and does not represent a
completed first-party avatar bundle.
