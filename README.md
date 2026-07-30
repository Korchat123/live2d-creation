# Open 2D Avatar

Open 2D Avatar is an original, portable 2D avatar system designed so humans,
scripts, and AI hosts can use the same provider-neutral control contract.

The repository has completed the Phase C runtime implementation. Workspace
packages remain private while the license and release policy are unresolved.
Phase C delivery evidence is still pending browser-matrix, coverage-threshold,
and GitHub Actions confirmation; see
[the Phase C status](docs/phase-status/phase-c.md) for the current gate.

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

See `live2d-model-plan.md` for product scope, `docs/phase-status/` for phase
gates, and `AGENTS.md` for repository contribution boundaries.

## License

No project license has been selected. The workspace is private and is not
approved for publication or redistribution.
