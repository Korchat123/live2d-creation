# Open 2D Avatar

Open 2D Avatar is an original, portable 2D avatar system designed so humans,
scripts, and AI hosts can use the same provider-neutral control contract.

The repository is in its foundation phase. Packages are intentionally private
and expose no product API until the vertical spike validates the contracts.

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
`pnpm typecheck`, `pnpm test`, and `pnpm build`.

See `live2d-model-plan.md` for product scope and `AGENTS.md` for repository
contribution boundaries.

## License

No project license has been selected. The workspace is private and is not
approved for publication or redistribution.
