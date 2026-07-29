# Release preflight

Open 2D Avatar remains private and is not approved for publication. This
procedure creates reviewable release evidence only; it does not publish,
deploy, sign, or create a GitHub release.

## Approval-gated workflow

`Release preflight` is manually dispatched with an immutable commit SHA or an
annotated tag. Its `release-approval` environment must be configured in GitHub
with the required reviewers before it is used. The workflow has read-only
repository permissions, installs with the committed lockfile and disabled
lifecycle scripts, then runs the complete CI suite and package dry run.

It uploads a short-lived `release-preflight-<commit>` evidence artifact that
contains:

- a Git-archive source ZIP for the exact checked commit;
- `checksums.sha256` for that ZIP and every tracked source file;
- `release-metadata.json`, mapping the commit to its archive and source hashes;
- `sbom.cdx.json`, a CycloneDX 1.5 inventory of workspace and lockfile
  dependencies.

The generated metadata is deterministic for a given Git commit and is ignored
by Git under `artifacts/`. Recreate it locally with:

```sh
pnpm run release:metadata
```

Before a future public release, a maintainer must separately approve the
project license and release policy, verify package/version compatibility,
review the generated SBOM and checksums, configure provenance/signing, and run
the clean-consumer and post-publish smoke tests. Those steps are intentionally
not implied by this preflight workflow.
