# Feature tracker

Statuses: `planned`, `building`, `candidate-pushed`, `evaluating`, `failed`, `recreating`, `passed`, `merged`, `released`.

Only an independent evaluator can move work to `passed`. Only a pushed merge commit can move work to `merged`.

| ID | Work package | Owner | Branch | Depends on | Required gate | Status | Candidate SHA | Evaluator evidence | Merge SHA |
|---|---|---|---|---|---|---|---|---|---|
| PLAN-001 | Clean restart and governance baseline | Root coordinator | `plan/clean-restart-governance` | — | Documentation review | building | — | Three independent planning reviews | — |
| M0-A | Canonical bust anatomy graph | Anatomy builder | `feat/m0-anatomy-graph` | PLAN-001 | Gate B | planned | — | — | — |
| M0-B | Parameter propagation and constraints | Parameter builder | `feat/m0-parameter-propagation` | M0-A | Gate B | planned | — | — | — |
| M0-C | SVG scene and export parity | Renderer builder | `feat/m0-svg-renderer` | M0-A, M0-B | Gate B + provenance | planned | — | — | — |
| M0-D | Three-column responsive shell | UI/UX builder | `ui/m0-three-column-shell` | PLAN-001; mock graph allowed | Gate G | planned | — | — | — |
| M0-E | M0 independent evaluation harness | Visual/technical QA | `review/m0-foundation-gate-1` | M0-A–D candidates | Gates B, G, H | planned | — | — | — |
| M1-A | Character bible and proportion sheet | Art director | `art/m1-character-bible` | M0 PASS | Gate A | planned | — | — | — |
| M1-B | Neutral separated bust pack | Layered artist | `art/m1-neutral-bust-pack` | M1-A PASS | Gates C, E | planned | — | — | — |
| M1-C | Neutral-art evaluation | Visual QA + provenance auditor | `review/m1-neutral-bust-gate-1` | M1-B candidate | Gates C, E, H | planned | — | — | — |
| M2-A | Anatomy and color customization | Engine/UI builders | `feat/m2-character-customization` | M1 PASS | Gate D | planned | — | — | — |
| M3-A | First compatible catalog family | Catalog builder | `art/m3-compatible-catalog-1` | M2 PASS | Gates C–E | planned | — | — | — |
| M4-A | Vendor-neutral rigging pack export | Export builder | `feat/m4-rigging-pack` | M3 PASS | Gates E, H | planned | — | — | — |
| M5-A | Real editable rig and runtime model | Rig builder | `rig/m5-standard-bust-runtime` | M4 PASS | Gate F | planned | — | — | — |
| M5-B | Final independent release audit | Visual QA, rig QA, provenance auditor | `review/v1-release-gate-1` | All prior PASS | Gates A–H | planned | — | — | — |

## Tracker update rules

- Update this table in the same commit that changes a work package’s delivery state.
- Never write `passed` without a pushed evaluator report for the exact candidate SHA.
- Never write `merged` without a pushed merge commit SHA.
- A failed candidate remains recorded until its replacement passes.
- Branch changes require a written reason; do not silently move work between branches.
