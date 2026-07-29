# Repository instructions

## Scope

- Follow `live2d-model-plan.md` and the task ownership in
  `subagent-work-plan.md`.
- Preserve dependency direction: applications may consume public packages;
  packages never import from applications.
- Do not invent public contracts before their scheduled phase and approval.
- Keep every workspace package private until the project license and release
  policy are approved.

## Changes

- Use explicit `workspace:` ranges for internal dependencies.
- Add CI coverage with each behavior change.
- Never commit secrets, environment files, recordings, generated output, or
  release archives.
- Treat bundles and commands as hostile data.
- Do not publish, deploy, sign, commit, or push unless the root task explicitly
  authorizes it.

## Verification

Run `pnpm run ci` from the repository root. Before handing off, state changed files,
verification, assumptions, and remaining risks.
