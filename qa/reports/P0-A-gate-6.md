# P0-A Gate A report — FAIL

- Candidate: `9fc62da8372ed7a098dfaec686fc6264a20b6f61`
- Candidate branch: `origin/feat/p0-anime-geometry-spec`
- Review branch: `review/p0-anime-geometry-gate-6`
- Governing contract: `standard-bust-v1/spec-0.5.0`
- Prior review: Gate 5 at `be842eca18b16921de1d1f9a0730f1ca25545f37`
- Independent result: **FAIL**

This sixth candidate fixes Gate 5's version split, restores the acromion to the authored region, accepts every advertised isolated endpoint, and preserves the real bust, broad zero-bust field, head, hair, ears, and mobile improvements. It still cannot pass Gate A. Fresh desktop and 390 px review shows the accepted trapezius/acromion/deltoid/torso path ending in a compact cap and pronounced inward hook, then continuing as a container-like side wall. Exact C1 at one landmark and passing sampled thresholds do not make that silhouette natural anatomy. Manual bounded edits also leave the evidence selector advertising a preset that is no longer rendered.

## Exact candidate and execution

The feature worktree was clean, and both its `HEAD` and `origin/feat/p0-anime-geometry-spec` resolved to the immutable candidate above. The review branch was created separately from `main`; no feature file was edited.

Commands run:

```text
npm.cmd test
$env:P0_CAPTURE_PATH=...; $env:P0_CAPTURE_DESKTOP_PATH=...; $env:P0_CAPTURE_VARIANTS_DIR=...; $env:P0_CAPTURE_MATRIX_DIR=...; npm.cmd run test:browser
node .gate-a-review-6.mjs
node --input-type=module -e <independent specification, fixture, path, and blocked-state inspection>
git diff --check main..9fc62da8372ed7a098dfaec686fc6264a20b6f61
```

The temporary evaluator harness drove the actual candidate in installed Chromium at `1440 x 1000` and `390 x 844`. It selected all 1,159 evidence options, read actual SVG boxes and path data, checked state identity and finite output, exercised all ten fixtures, compared visible body/chest paths at five bust values, measured the rendered acromion and body intersections, audited the DOM, and captured presets, relevant bounds, worst-valid, adult-safe, and bust variants with Measurements off. The harness and PNGs were not committed. Compact results and capture hashes are in `qa/evidence/P0-A-gate-6.json`.

Results:

- Candidate Node suite: 35/35 passed.
- Candidate real-Chromium responsive/capture suite: 1/1 passed.
- Independent actual-rendered-state sweep: 1,159/1,159 rendered; 1,122 `Needs review`, 37 `Blocked`; zero selector/state-name mismatches, zero non-finite body/hair/head boxes.
- Advertised endpoints: 48/48 individual min/max states rendered `Needs review`.
- The 37 blocked evidence states are pairwise derived-invariant failures plus the authored `boundary:adult-blocked`; there are no isolated endpoint rejections.
- Negative fixtures: 10/10 rendered `Blocked` with their intended defect families.
- Contract identity: the bible, executable spec, README, visible label, stage dataset, control bounds, and neutral values all expose `standard-bust-v1/spec-0.5.0`; the bible parser found exact key/order/min/max/neutral parity for all 24 parameters. UI control labels come directly from those same 24 definitions.
- Anti-cheating: one computed SVG; zero image/canvas elements, raster character assets, alternate renderer, rig binary, or `Approved` shortcut.

## Blocking defect

### A3 — The accepted shoulder/deltoid still reads as a hook and container

The corrected neutral anatomy has its root at approximately `(440.6, 500.8)` and acromion at `(196.25, 552.8)`, so the actual rendered root slope is `0.21`, within the authored `0.17..0.29`. The actual path reaches the acromion within `0.16` canvas units. Its incoming/outgoing cubic metric reports mismatch `0` and join angle `0°`. The previous late `y≈581` cap is therefore genuinely gone.

The complete visible contour still fails. At neutral the filled width is about `607` at the acromion, swells to `622` at `+24`, remains `620` at `+48`, and is still `596` at `+90`; it then collapses abruptly to `511` at `+150` before settling into the long torso side. This creates a compact rounded-square cap followed by a deep inward hook. At both intended scales it reads as a sleeveless vessel/container outline, not a continuous trapezius–acromion–deltoid–upper-arm/torso contour.

The feminine, androgynous, masculine, shoulder ratio min/max, shoulder drop min/max, and worst-valid captures all retain the same topology. The defect is especially clear at 390 px, where the small cap and hook dominate while subtler cubic curvature disappears. The masculine and worst-valid states exaggerate the broad container reading. This violates the character bible's explicit rejection of a compact square cap, hanger shelf, hook/container silhouette, and nonhuman torso contour.

The validator cannot substitute for this review: its neutral metrics (`shoulderChordDeviation 12.41`, maximum straight run `96`, shelf length `13.73`, deltoid padding `7.49`, side displacement `66.22`) all pass while the actual app still shows the forbidden shape. This is exactly why Gate A remains independently vetoable after automated success.

## Material evidence/state mismatch

After selecting `preset:neutral` and changing the bust slider to any bounded value, the toolbar correctly changes to `custom:bounded` and the presentation selector clears. The reproducible-evidence selector does not clear: it continues to display `preset:neutral`. Fresh zero, low, neutral-adjacent, and maximum bust captures therefore visibly advertise a preset evidence state while rendering a custom state.

This does not invalidate the independent selector sweep, whose programmatic selections had zero identity mismatches, but it does invalidate screenshot provenance for normal manual edits and makes the evidence UI internally contradictory. Clear the evidence selector or give custom values a serialized selectable identity whenever a slider edit changes the rendered parameters.

The repository tracker also remains at `P0-A: recreating`, lists failed candidates only through `0492c7a`, and cites Gate 5. It does not record this submitted candidate SHA even though README calls the current tree a candidate. The evaluator report fixes review traceability, but the delivery record should be synchronized before any future pass/merge decision.

## Prior-defect retest

| Gate 5 item | Result | Evidence |
|---|---|---|
| bible/executable version split | PASS | Bible, executable, README, UI, and browser stage agree on spec 0.5.0; all 24 triples match. |
| ten self-blocking isolated endpoints | PASS | All 48 advertised individual bounds render `Needs review`. |
| late acromion near y=581 | PASS | Neutral actual acromion is y=552.8 with exact C1. |
| square/hooked/container shoulder | **FAIL (improved)** | Raised and numerically smooth, but the cap-to-side topology still visibly forms a hook/container at desktop and mobile. |
| bust response and zero-bust topology | PASS | Five tested values produce distinct body and chest paths; zero keeps the same broad torso-owned field with no bib. |
| ears, hair, head, mobile | PASS | Ears remain readable, hair fits the skull, face/head stay coherent, and the 390 px layout is centered and contained. |

## Criterion matrix

| Gate A criterion | Result |
|---|---|
| Exact pushed candidate identity | PASS |
| Exact contract/version/control parity | PASS |
| All advertised isolated bounds | PASS |
| Pairwise/correlated rejection behavior | PASS |
| 35 tests, Chromium responsive test, 1,159-state sweep | PASS |
| Required rejection fixtures | PASS |
| Real visible bust/default deformation and broad zero bust | PASS |
| Head, hair, ears, face, and mobile containment | PASS |
| Exact acromion C1 and root slope | PASS |
| Natural shoulder/deltoid/torso contour | **FAIL** |
| Evidence identity after manual edits | **FAIL** |
| Anti-cheating/provenance scan | PASS |

## Required recreation and retest

1. Re-author the full shoulder-cap-to-upper-arm/side-torso contour. Preserve the corrected acromion height, root slope, C1 join, progressive taper, and bounded deltoid tissue, but remove the compact outer cap, deep inward hook, and vessel/container reading at desktop and 390 px.
2. Add a regression measure that detects the abrupt `+90` to `+150` collapse and the hooked change in curvature; retain visual review because a local threshold cannot approve anatomy.
3. Synchronize the evidence selector after manual bounded or reconciled edits, and add a browser assertion covering toolbar, preset selector, evidence selector, controls, and rendered state identity together.
4. Update the tracker/evidence packet to record the next exact candidate SHA.
5. Preserve spec 0.5 parity, all 48 accepted isolated endpoints, documented correlated rejection, visible bust/zero-bust behavior, hair/head/ears, and mobile containment. Rerun all 1,159 states, fixtures, path metrics, and fresh capture matrix.

Final decision: **FAIL**.
