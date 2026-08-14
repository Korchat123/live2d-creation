# PLAN-001 independent planning gate 2

- Content candidate: `617a85ff77bea0aa598bb2cac197f0bedbea72a2`
- Tracker-only submission: `25f6dd372430174b33507341195ba7d5985cb7bf`
- Submission branch verified: `origin/plan/clean-restart-governance`
- Prior failed candidate: `4263c82d344a058fc1d6c1b4bf725a7b1f1d402b`
- Prior review: `576075ab164716b4862eca0b344702d97e2399a2`
- Review branch: `review/plan-001-gate-2`
- Result: **PASS**

This PASS approves the remediated PLAN-001 planning/governance content at exactly `617a85f`, as submitted by tracker-only commit `25f6dd3`. It does not itself pass P0-A/Gate A: M0 remains blocked until an independent Gate A evaluation receives and approves the geometry evidence required by `CHARACTER_BIBLE.md`.

## Prior-defect verification

### PLAN-001-01 — remediated

The professional anime specification now precedes M0:

- `CHARACTER_BIBLE.md` versions the target as `standard-bust-v1/spec-0.1.0` and states that M0 is blocked pending independent Gate A approval of the exact version and commit.
- `PRODUCT_PLAN.md` adds P0 before M0 and requires Gate A to pass before neutral geometry or parameter bounds are implemented.
- `MULTI_AGENT_PLAN.md` makes P0 a mandatory predecessor to WP-A/WP-B, adds Wave 0 with an independent evaluator veto, and prohibits M0 anatomy, parameter, renderer integration, and decorative art work before Wave 0 passes.
- `FEATURE_TRACKER.md` makes M0-A depend on `P0-A PASS`, M0-B depend on `P0-A PASS, M0-A`, and even the UI shell depend on `P0-A PASS`.

The contract is measurable enough to reject the previously observed miniature-head/monster anatomy:

- Neutral shoulder span is `830 - 170 = 660`; bare-head width is `270`; their ratio is `2.444`, matching the declared `2.44` target.
- Shoulder/head is a hard-fail outside `2.15..2.65`, preventing the very broad body with miniature face failure mode.
- Bare-head height/width, jaw/cranium, neck/head, eye spacing, eye size, vertical facial thirds, hair envelope, and covered bust/shoulder ratios all have numeric targets and hard ranges.
- Neutral feature coordinates are internally consistent: eye-to-nose is `62/165 = 0.376`, nose-to-mouth is `43/165 = 0.261`, and mouth-to-chin is `60/165 = 0.364`, matching their targets.
- Landmark ordering, center-line agreement, neck/collar containment, shoulder descent, bust containment, hair overlap, outfit scaling, and combined-extreme rejection are explicit invariants.
- Gate A requires reproducible geometry, computed ratios, all presets, min/max and pairwise combined extremes, plus negative fixtures for miniature head, rectangular shoulders, misplaced face, wig gap, floating neck, and detached bust.
- Contract changes require versioning and a new Gate A review; tests cannot be weakened to accept failure.

These rules are sufficient at the planning level to prevent a structurally valid graph from being approved solely because its transforms work. Actual P0-A approval still requires the specified geometry evidence and independent visual/measurement evaluation.

### PLAN-001-02 — remediated

Immutable candidate bookkeeping is unambiguous:

- Content commit `617a85f` contains the actual remediation: `CHARACTER_BIBLE.md` plus changes to `PRODUCT_PLAN.md`, `MULTI_AGENT_PLAN.md`, and `FEATURE_TRACKER.md`.
- Submission commit `25f6dd3` is the direct child of `617a85f` and changes only `FEATURE_TRACKER.md`.
- The tracker explicitly defines its Candidate SHA as the immutable content commit; later tracker-only result updates do not redefine it.
- PLAN-001 and P0-A both record `617a85f` while the branch tip and remote submission resolve to `25f6dd3`.
- The previous candidate and Gate 1 failure remain traceable in the tracker rather than being rewritten.

## Gate 1 regression matrix

| Criterion | Gate 2 result | Evidence |
|---|---|---|
| Clean restart; old collage removed | PASS | The submission tree still contains planning/governance files only; no previous application, generated result, production asset, or dependency tree was restored. |
| Anatomy-first parent transform model | PASS | `PRODUCT_PLAN.md`, `ARCHITECTURE.md`, and WP-A/WP-B retain the canonical graph, named sockets, bounded propagation, deterministic traversal, and prohibition on stage-global part positioning. The new bible strengthens this with numeric landmarks and invariants. |
| Three-column game-creator UX | PASS | Left remains anatomy/proportion/color/presentation/style, center remains the largest permanent real-result stage, and right remains compatible part selection. Gate G retains first-time usability, safe reset, blocked-choice clarity, responsive access, and exact-result export. |
| No flattened/generated substitution | PASS | The explicit automatic failures for generated finished-character insertion, hidden master images, screenshots, baked previews, conditional artwork, alternate export results, inert controls, cropped evidence, and production-accessible references remain unchanged. |
| Evaluator veto and rework/recreation | PASS | Builders still cannot self-approve; visual QA, technical QA, and provenance audit retain independent vetoes. The defect loop, different recreation owner for structural failure, full regression rerun, and no waiver by root/schedule remain intact. |
| Objective evidence | PASS for PLAN-001 | The new bible supplies exact coordinates, tolerances, ratios, hard ranges, ordering invariants, automatic rejection conditions, and required negative fixtures. The broader plan still requires hashes, exact state, overlays, extremes, stage/export comparison, catalog matrices, and real runtime proof. |
| Per-feature branch/commit/push/review | PASS | Candidate and submission exist on `origin`; content and bookkeeping identities are separated; review must be independently committed/pushed; fixes append history; exact-SHA PASS is required before merge; evaluator branches contain reports only. |
| Honest Live2D outcome | PASS | Early output remains labeled rigging preparation; editable rig, runtime load, real parameters, physics, and motion stress evidence remain mandatory before claiming a Live2D model. |

## Defects

None at the PLAN-001 planning gate.

## Required next gate

P0-A/Gate A must independently evaluate the reproducible geometry-only bust and all evidence named in `CHARACTER_BIBLE.md`. Until that separate PASS is pushed and recorded for the exact bible version and content SHA, M0 implementation is prohibited.
