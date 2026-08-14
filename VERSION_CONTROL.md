# Version-control and delivery protocol

## 1. Mandatory rule

Every feature, asset family, evaluator report, fix, and milestone must exist in Git history and be pushed to `origin` before it can be marked complete.

Work that exists only in an agent workspace, screenshot, generated output folder, or chat response does not count as delivered.

## 2. Protected branch model

- `main` is the reviewed integration/release branch.
- Agents do not implement features directly on `main`.
- Each bounded work package gets a branch from the latest `origin/main`.
- History on shared branches is never rewritten after review begins.
- Force-pushes to `main`, release tags, or evaluator branches are forbidden.

Branch names:

```text
plan/<scope>                 planning and contracts
feat/<milestone>-<feature>   product or engine feature
ui/<milestone>-<feature>     UI/UX feature
art/<milestone>-<asset>      production layered art
rig/<milestone>-<model>      rigging work
fix/<milestone>-<defect>     defect correction
review/<feature>-gate-<n>    independent evaluator evidence
```

Examples:

```text
feat/m0-anatomy-graph
ui/m0-three-column-shell
feat/m0-svg-renderer
art/m1-neutral-bust-pack
review/m1-neutral-bust-gate-1
rig/m5-standard-bust-runtime
```

## 3. Feature lifecycle

1. Root creates a feature ID and acceptance contract in `FEATURE_TRACKER.md`.
2. Builder creates a branch from current `origin/main`.
3. Builder commits tests/contracts before or with implementation.
4. Builder pushes the branch at each reviewable checkpoint.
5. Builder records the exact candidate commit SHA in the tracker/evidence packet.
6. Independent evaluator checks that remote SHA—not uncommitted workspace state.
7. Evaluator publishes its report on a separate `review/...` branch and pushes it.
8. `FAIL` returns exact defects to the builder or a recreation owner.
9. Fixes receive new commits and pushes; rejected commits remain in history.
10. Evaluator reruns the complete applicable gate against the new SHA.
11. Only a pushed evaluator `PASS` allows merge.
12. Merge preserves feature commits and creates an explicit merge commit on `main`.
13. The merged `main` SHA is pushed and recorded in the tracker.

No feature status may say `complete` while its branch or evaluator report exists only locally.

## 4. Commit policy

Use small, reviewable Conventional Commits:

```text
plan: define M0 anatomy socket contract
test(anatomy): cover parent transform propagation
feat(anatomy): implement canonical bust graph
fix(anatomy): keep collar inside shoulder bounds
art(base): add separated neutral face layers
test(visual): add neutral bust combination evidence
review(m0): fail anatomy gate for neck drift
review(m0): pass anatomy graph at candidate <short-sha>
```

Each commit must:

- have one clear purpose;
- include relevant tests or state why tests are not applicable;
- avoid unrelated formatting or generated noise;
- contain no secrets, dependency folders, build outputs, or temporary generation files;
- identify recreated assets rather than silently replacing rejected files;
- leave the branch buildable unless explicitly labeled `WIP` before review.

Do not amend or rebase commits after an evaluator has cited their SHA. Add a corrective commit instead.

## 5. Builder and evaluator separation

- A builder cannot create the passing evaluator commit for its own feature.
- The evaluator reviews a clean checkout of the pushed candidate SHA.
- Evaluation reports identify candidate SHA, commands, evidence, result, and defects.
- Evaluator branches contain reports and compact evidence manifests—not implementation fixes.
- If the evaluator finds a structural failure, root assigns recreation to another agent where practical.
- A new evaluator is required if the original evaluator becomes the fix owner.

## 6. Required checks before push

Every code feature branch:

- formatting/static checks;
- unit/contract tests;
- affected visual/browser tests;
- stage/export parity when rendering changes;
- `git diff --check`;
- secret and unexpected-large-file review;
- exact changed-file review.

Every art branch:

- asset manifest validation;
- transparent-bound/overlap inspection;
- app-rendered assembly evidence;
- combination and parameter-extreme captures;
- provenance declaration;
- confirmation that no flattened master enters production asset paths.

Every rig branch:

- editable project inventory;
- runtime-load test;
- parameter and combined-extreme sweep;
- source-layer hash link to the approved art commit;
- motion evidence manifest.

## 7. Binary assets and generated material

- Configure and verify Git LFS before committing large layered sources or binary rig projects.
- Production PNGs must be necessary, optimized, and declared by a manifest.
- Generated reference pictures belong outside production asset paths and are not committed unless the Art Director explicitly needs a small, labeled reference.
- Temporary chroma, intermediate generations, screenshots, caches, and exports are ignored or stored as CI artifacts.
- Evaluator evidence commits store compact selected captures and metadata; large videos belong in an approved artifact store linked by immutable identifier.

## 8. Merge and release policy

A feature can merge only when:

- its remote branch is current;
- required CI checks pass;
- independent evaluator report says `PASS` for the exact candidate SHA;
- provenance audit passes when applicable;
- tracker records branch, candidate SHA, evaluator branch/report, and decision;
- no blocker or major defect remains.

Do not squash away evidence-bearing history. Use a non-fast-forward merge so the feature boundary remains visible.

Milestone versions:

- `v0.1.0` — M0 anatomy graph, renderer foundation, and UI shell approved;
- `v0.2.0` — M1 coherent neutral layered art approved;
- `v0.3.0` — M2 real customization approved;
- `v0.4.0` — M3 compatible catalog approved;
- `v0.5.0` — M4 rigging-preparation export approved;
- `v1.0.0` — real rig/runtime and final usability/provenance gates approved.

Patch releases fix approved behavior without expanding scope. Tags are annotated, pushed, and created only from reviewed `main` commits.

## 9. Failure, rollback, and recreation

- Failed candidate commits remain traceable; they are not hidden by history rewriting.
- Use `git revert` for a merged regression; never use destructive history rewriting on shared branches.
- A recreated asset gets a new versioned ID/path and a commit referencing the rejected defect report.
- Rejected assets are removed from manifests/catalogs and may be archived outside production paths.
- Rollback does not waive evaluation: the restored SHA must still have applicable passing evidence.

## 10. Push verification

After every push, record and verify:

```text
Feature ID:
Local branch:
Remote branch:
Candidate SHA:
Upstream tracking:
CI/check result:
Evaluator report branch/SHA:
Merge commit SHA:
Release tag, if any:
```

The root coordinator verifies `git status`, upstream tracking, and remote branch visibility before reporting delivery.
