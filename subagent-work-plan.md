# Sub-Agent Work Plan

This document divides the Open 2D Avatar project into bounded work packages for
delegated agents. The canonical product requirements remain in
`live2d-model-plan.md`; `subagents.toml` is the machine-readable copy of this
task graph.

## Operating rules

- The root agent owns integration, architecture decisions, dependency changes,
  shared configuration, and final acceptance.
- One agent owns a file or package at a time.
- Agents must inspect the current workspace before editing and preserve
  unrelated changes.
- Agents may not change public contracts, add dependencies, or expand scope
  without notifying the root agent.
- Every handoff states changed files, verification performed, remaining risks,
  and any decisions required.
- Research agents produce documents only; implementation agents do not silently
  turn unresolved questions into architecture decisions.
- Tasks with unmet dependencies remain blocked.
- Commits are optional unless the root agent explicitly requests them. Agents
  must never push, publish, deploy, or create releases independently.
- Every task that adds behavior must add or update its CI coverage. CD changes
  require root review and immutable artifacts labeled with the tested commit.

## Shared definition of done

A task is complete only when:

1. its listed deliverables exist;
2. its acceptance criteria are satisfied;
3. relevant tests, type checks, linting, or document checks pass;
4. no secrets, generated build output, or unrelated files were added;
5. the handoff identifies assumptions and unresolved risks.
6. the behavior runs in CI and any phase artifact traces to the tested commit.

## Recommended execution waves

### Wave 0 - Decisions and repository foundation

Run `W0-A` and `W0-B` in parallel. The root agent reviews both, records final
decisions, then runs `W0-C`. Do not scaffold packages before those decisions are
accepted.

#### W0-A - Runtime and format research

Owner role: architecture research agent  
Write scope: `docs/adr/0001-runtime-and-format.md`

Deliverables:

- compare a custom PixiJS runtime with eligible open non-Cubism alternatives;
- record licensing, redistribution, browser, TypeScript, control, export, and
  maintenance evidence;
- recommend a production renderer and fallback policy;
- list risks that the vertical spike must prove.

Acceptance:

- claims about current tools cite primary sources;
- recommendation preserves the provider-neutral control contract;
- no implementation files are modified.

#### W0-B - Product policy research

Owner role: product/security agent  
Write scope:

- `docs/adr/0002-supported-platforms.md`
- `docs/security/threat-model.md`

Deliverables:

- proposed supported browsers and reference development device;
- bundle and command trust boundaries;
- resource-limit categories and privacy rules;
- accessibility and reduced-motion baseline.

Acceptance:

- distinguishes v1 requirements from future work;
- covers malformed bundles, hostile commands, camera/audio privacy, and remote
  control authorization.

#### W0-C - Workspace scaffold

Owner role: build/tooling agent  
Depends on: `W0-A`, `W0-B`, root approval  
Write scope: root configuration and empty package/app skeletons

Deliverables:

- pnpm workspace and pinned runtime/toolchain policy;
- TypeScript base configuration;
- lint, format, unit-test, type-check, and build commands;
- package boundaries matching the target repository structure;
- CI workflow and contributor instructions.
- phase-aware CI and a manual dry-run artifact workflow.

Acceptance:

- clean install is reproducible;
- lint, type-check, test, and build succeed from the repository root;
- workflows use minimum permissions and ordinary CI receives no protected secret;
- workspace packages use explicit `workspace:` dependencies;
- empty packages do not expose speculative APIs.

### Wave A - Rights and visual specification

After `W0-C`, run `A1`, `A2`, and `A3` in parallel. `A4` integrates them.

#### A1 - Rights inventory

Owner role: asset-rights agent  
Write scope:

- `assets/reference-avatar/LICENSES/rights.json`
- `docs/authoring/rights-checklist.md`

Deliverables:

- machine-readable source, author, license, modification, and redistribution
  record format;
- an entry for every current asset/reference, including an explicit empty-state
  declaration when no assets exist;
- review procedure for future additions.
- CI rights validation and a review-report artifact.

Acceptance:

- does not claim ownership without evidence;
- unresolved ownership is marked blocked and cannot pass export validation.

#### A2 - Character and layer specification

Owner role: art-direction agent  
Write scope:

- `docs/authoring/visual-spec.md`
- `docs/authoring/layer-spec.md`

Deliverables:

- character silhouette, palette, proportions, poses, safe areas, canvas, and
  texture budget;
- layer hierarchy, naming rules, pivots, masks, draw order, and deformation
  intent;
- turnaround and expression-sheet acceptance criteria.

Acceptance:

- uses only original placeholders or properly recorded references;
- separates creative choices requiring human approval from technical rules.

#### A3 - Capability acceptance specification

Owner role: QA/product agent  
Write scope:

- `docs/protocol/capabilities.md`
- `docs/authoring/acceptance-checklist.md`

Deliverables:

- testable definitions for expressions, motions, gaze, blink, mouth-open, pose,
  interruption, reset, and reduced motion;
- RMS-only versus viseme decision proposal;
- human and AI control acceptance scenarios.
- CI requirements-traceability checks.

Acceptance:

- every requirement has observable pass/fail behavior;
- model-specific parameter names do not enter the semantic protocol.

#### A4 - Phase A review

Owner role: root agent  
Depends on: `A1`, `A2`, `A3`

Deliverables:

- resolve cross-document inconsistencies;
- obtain human approval for creative and budget choices;
- record Phase A gate status.

Acceptance:

- no unresolved rights item is treated as approved;
- canvas, texture, performance, language, and capability targets are explicit.

### Wave B - Vertical spike

Run `B1` first. Then `B2` and `B3` may run in parallel against the frozen
contracts. `B4` verifies the integrated result.

#### B1 - Schema and control contracts

Owner role: protocol agent  
Depends on: `W0-C`, `A4`, approved runtime ADR  
Write scope:

- `packages/schema/`
- `docs/protocol/control-api.md`

Deliverables:

- Draft 2020-12 schemas for minimal bundles and command envelopes;
- generated or source TypeScript types;
- capability query, acknowledgement, cancellation, and error contracts;
- valid and malformed fixtures.
- schema and malformed-fixture CI jobs.

Acceptance:

- rejects traversal, absolute paths, non-finite values, invalid ranges, and
  unknown major versions;
- continuous input channels are coalescible;
- protocol has no AI-provider or UI-specific fields.

#### B2 - Core animation spike

Owner role: runtime agent  
Depends on: `B1`  
Write scope: `packages/core/`

Deliverables:

- deterministic clock interface;
- scheduler, interruption, cross-fade, parameter layers, and clamps;
- gaze, blink, mouth-open, expression, motion, and reset evaluation;
- unit tests using a fake clock.
- core contract and coverage CI jobs.

Acceptance:

- same inputs, seed, and clock produce the same poses;
- lip sync and gaze write only declared channels;
- reset returns to a stable neutral state.

#### B3 - Renderer and bundle spike

Owner role: graphics agent  
Depends on: `B1`  
Write scope:

- `packages/renderer-pixi/`
- `assets/fixtures/minimal-avatar/`

Deliverables:

- layered head/torso render;
- at least one deformable mesh;
- load, resize, render, context-recovery, and dispose lifecycle;
- original or clearly licensed placeholder assets.
- browser lifecycle and golden-render CI jobs.

Acceptance:

- no GPU resource remains after dispose;
- renderer consumes evaluated pose data rather than control commands;
- renderer does not import from apps.

#### B4 - Studio spike and performance report

Owner role: integration agent  
Depends on: `B2`, `B3`  
Write scope:

- `apps/studio/`
- `tests/performance/spike-report.md`

Deliverables:

- a human panel and scripted controller using the same runtime API;
- capability inspector, gaze, blink, mouth-open, expression, motion, and reset
  demonstrations;
- frame-time, memory, bundle-size, resize, context-loss, and remount results.
- an approval-gated preview tied to the tested commit.

Acceptance:

- human override behavior is observable;
- target reference device sustains the approved performance budget;
- repeated mount/dispose does not show resource growth.

### Later waves

Create detailed tasks for Phases C-G only after the vertical spike freezes the
public boundaries. The expected owners are:

- Core runtime: `packages/core`, `packages/runtime`.
- Control adapters: `packages/controls`.
- Audio/visemes: `packages/audio`.
- Validation/export: `packages/validator`, `packages/exporter`.
- Human authoring: `apps/studio`.
- Embedding: `packages/web-component`, `apps/playground`.
- First-party art/rig: `assets/reference-avatar`.
- QA/release: `tests`, documentation, release metadata.

Avoid pre-assigning implementation details that the spike may invalidate.

## Root-agent integration checklist

- Confirm all dependencies are complete.
- Review public API and schema changes before integrating consumers.
- Check that write scopes did not overlap.
- Run repository-wide lint, type-check, unit, integration, and build commands.
- Review licenses and dependency changes.
- Update ADR status and the canonical product plan.
- Ask for human approval at creative, security-policy, and release gates.
