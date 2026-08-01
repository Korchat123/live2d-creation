# Prompt-to-Live2D Studio

This repository is planning a prompt-first authoring Studio that generates a
consistent 2D character and purpose-built, transparent parts, then assembles
and rigs them for the existing Open Avatar browser runtime. It also plans
non-destructive prompt edits for generated projects and a layered PSD handoff
for Live2D Cubism Editor.

Phases P0 through P2 are accepted and the production-model benchmark is in
progress. The existing provider-neutral runtime, renderer, validation,
controls, and Studio work are retained as foundations. See
[`live2d-model-plan.md`](live2d-model-plan.md) for the canonical plan and
[`plan.md`](plan.md) for the immediate execution order. The remaining technical
and product risks have concrete gates in [`roadmap.md`](roadmap.md).

Both output paths are planned. Open Avatar is the default automated rig,
preview, and export. A Cubism-ready PSD is an optional additional export and
becomes a genuine Cubism model only after it is imported, rigged or verified,
and exported by Live2D Cubism Editor. An Open Avatar bundle is not itself a
Live2D Cubism model. Workspace packages remain private while the project
license and release policy are unresolved.

## Requirements

- Node.js 24
- Corepack with pnpm 11.17.0

## Development

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm run ci
```

Useful individual commands are `pnpm format:check`, `pnpm lint`,
`pnpm typecheck`, `pnpm test`, `pnpm build`, and `pnpm package:dry-run`.

## Local concept-generation spike

Phase P1 can connect the Studio development server to a local ComfyUI instance
at `127.0.0.1:8188`. Checkpoint discovery never authorizes a model
automatically. Before starting Studio, set `VITE_COMFY_CHECKPOINTS` to a
comma-separated allowlist of installed checkpoint filenames whose rights you
have reviewed, then run `pnpm --filter @open-avatar/studio dev`.

Generated candidates remain drafts until explicit acceptance. The P1 gate
passed a labelled physical ComfyUI generation and cancellation test on the
reference RTX 3050 laptop. CI uses a deterministic fake provider and does not
download models.

Phase P2 is also accepted: candidate comparison, design locking, editable
character bible, normalized landmarks, bounded part dependencies, IndexedDB
persistence, and validated project-file round trips are implemented. The next
gate is the production-model control experiment in `roadmap.md`. The
prompt-only Animagine benchmark passed hardware stability but failed framing
and identity quality, so the checkpoint is not production-approved. Its frozen
protocol and evidence are recorded in
[`docs/authoring/production-model-benchmark.md`](docs/authoring/production-model-benchmark.md).

See `docs/phase-status/` for historical delivery evidence and `AGENTS.md` for
repository contribution boundaries.

## License

No project license has been selected. The workspace is private and is not
approved for publication or redistribution.
