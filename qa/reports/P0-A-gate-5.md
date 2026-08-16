# P0-A Gate A report — FAIL

- Candidate: `0492c7ab110e7fb6d21ea46374a148b4183277cb`
- Candidate branch: `origin/feat/p0-anime-geometry-spec`
- Review branch: `review/p0-anime-geometry-gate-5`
- Governing character bible: `standard-bust-v1/spec-0.3.0`
- Candidate's executable claim: `standard-bust-v1/spec-0.4.0`
- Prior review: Gate 4 at `9f46c62` (`P0-A-gate-4.md`)
- Independent result: **FAIL**

The fifth recreation makes real progress on all three Gate 4 defects. Bust volume now changes both the visible body path and the torso-owned chest surface; zero bust retains a broad torso; the previously self-blocking minimum-shoulder/minimum-drop pair is accepted; and the acromion join, ears, head, and hair remain structurally sound. It still cannot pass Gate A. The candidate changes the executable specification instead of implementing the controlling character bible, exposes ten individual slider bounds that immediately self-block, and obtains its new shoulder shape from an out-of-contract 80-unit drop that still reads as a late square shoulder cap/container rather than the approved anatomy.

## Exact candidate and reproducible evidence

The clean feature worktree `HEAD` and pushed feature ref both resolved to the immutable candidate above. The review branch/worktree was created separately from `main`; no feature file was edited.

Commands run:

```text
npm.cmd test
$env:P0_CAPTURE_PATH=...; npm.cmd run test:browser
node .gate-a-review.mjs
node --input-type=module -e <independent bound/error and neutral-geometry inspection>
git diff --check 8a09c70..0492c7a
```

The independent harness drove the real candidate in installed Chromium at `1440 x 1000` and `390 x 844`. It selected all 1,159 evidence options, inspected actual SVG boxes and paths, compared state identity, exercised all ten fixtures, measured filled-body intersections and the acromion, compared visible body/chest path hashes at bust `0/.08/.50/.64`, audited the DOM for alternate renderers, and captured all presets plus head, shoulder, bust, adult-safe, and worst-valid states with the Measurements overlay off. The temporary harness and PNGs were not added to the repository. Compact measurements and capture hashes are in `qa/evidence/P0-A-gate-5.json`.

Results:

- Candidate Node suite: 33/33 passed.
- Candidate real-Chromium mobile suite: 1/1 passed.
- Independent exposed-state sweep: 1,159/1,159 rendered; 731 `Needs review`, 428 `Blocked`; zero state-identity mismatches and zero non-finite path boxes.
- Negative fixtures: 10/10 rendered `Blocked` with their intended defect family.
- Actual rendered hair/head range: `1.12..1.32`; body/head range: `2.05..2.48`.
- Gate 4 shoulder-pair regression: `pair:shoulderHeadRatio:min+shoulderDrop:min` now renders `Needs review`.
- Mobile containment: the candidate's real-browser test passed at 390 px; fresh captures remain centered and contained.
- Anti-cheating: one computed SVG; no stage image, canvas, raster character asset, generated/flattened result, rig binary, alternate renderer, or `Approved` shortcut.

## Blocking defects

### A0 — The candidate does not implement the governing specification

`CHARACTER_BIBLE.md` remains explicitly versioned `standard-bust-v1/spec-0.3.0` and says that changing a target, range, tolerance, formula, or invariant requires a new spec version and independent Gate A review. This candidate changes `src/spec.js`, `README.md`, and tests to claim `spec-0.4.0`, but does not update the character bible. The changed values directly contradict its controlling contract:

| Measurement | Governing `spec-0.3.0` | Candidate executable / actual neutral |
|---|---:|---:|
| shoulder-root to acromion drop | `24..60`, neutral `44` | `72..88`, actual `80` |
| neutral acromion Y | approximately `545` | `580.808` |
| torso width at y=850 / garment shoulder | `0.78..0.90`, neutral `0.85` | `0.70..0.80`, actual `0.729` |

The tests pass because they import the changed executable and assert the changed values. They do not compare it to the required character bible. Gate A is approval of one exact versioned contract plus its implementation; an unreviewed executable version cannot substitute for that contract.

### A1 — Ten advertised individual parameter bounds self-block

The evidence selector exposes each parameter minimum and maximum as a reproducible state, and the left panel advertises those same limits as usable slider endpoints. Ten states made by changing only one parameter from neutral render `Blocked`:

| Individual bound | Blocking derived rule |
|---|---|
| `upperNeckHeadRatio:min` | `ratio.upperNeckJaw` |
| `chinCraniumRatio:min` | `silhouette.curvature` |
| `eyeCenterFaceRatio:min` | `ratio.innerGapEye` |
| `eyeWidth:min`, `eyeWidth:max` | `ratio.innerGapEye` |
| `eyeHeight:min`, `eyeHeight:max` | `ratio.eyeAspect` |
| `mouthWidth:max` | `ratio.mouthEyeCenters` |
| `mouthChinShare:min`, `mouthChinShare:max` | `ratio.noseMouth` |

These are not malformed fixtures or unsafe pairwise corners. They are advertised single-control bounds. In the normal UI, attempting them is silently reconciled back to the previous value. This violates the requirement that authored allowed states avoid self-block and makes the published ranges misleading.

### A3 — The shoulder fix still reads as a low square cap/container and is outside the approved anatomy

The Gate 4 long upright side is materially improved: neutral filled-body widths narrow from `528` at `y=665` to `486` at `y=785` and `438` at `y=910`, and the exact acromion join remains continuous. The overall shoulder is still not acceptable.

The neutral root is at `y=500.808`, but the candidate delays the acromion to `y=580.808`. Actual fill width jumps from `368` at `y=545` to `604` at `y=575`, then turns around a compact near-vertical cap. At desktop and 390 px this reads as a sloped hanger terminating in squared sleeve/container corners. The feminine, masculine, shoulder extrema, and worst-valid bundle preserve the same topology. This is the visual consequence of increasing the drop beyond the character bible's maximum and aggressively reducing the torso ratio, not a valid recreation under the approved geometry.

## Gate 4 defect retest

| Gate 4 item | Result | Evidence |
|---|---|---|
| long slab side | **FAIL (improved)** | Downstream contour now tapers meaningfully, but the out-of-contract late acromion creates a low square cap/container silhouette. |
| bust control changed only metadata | PASS | Body and chest `d` hashes are distinct at `0/.08/.50/.64`; chest bbox grows from about `476.1 x 239` to `512.3 x 251`, opacity changes `.18` to `.40`, and the normal stage changes without the overlay. |
| zero bust / floating bib | PASS | Zero remains a broad torso-owned surface; no detached triangle, bra, or moustache path appears. |
| minimum shoulder + minimum drop self-block | PASS | The exact pair now reports `Needs review`. |
| ears, hair, and head | PASS | Both ears and inner details remain visible; hair/head fit and ranges hold at desktop and phone sizes. |

## Criterion matrix

| Gate A criterion | Result | Evidence |
|---|---|---|
| Exact pushed candidate identity | PASS | Clean feature `HEAD` and origin ref equal `0492c7a...`. |
| Exact specification identity and change control | **FAIL** | Character bible is 0.3.0; executable, README, and tests claim an unreviewed 0.4.0 with contradictory ranges. |
| No generated/flattened result or self-approval | PASS | Computed SVG only; no raster/canvas/alternate renderer/approval shortcut. |
| Unit and real-browser execution | PASS | 33/33 Node, 1/1 candidate browser, complete independent Chromium sweep. |
| Honest visible bust propagation | PASS | Actual visible body and chest paths differ across all four tested bust values. |
| Zero-bust torso topology | PASS | Broad connected torso remains; no floating bib or collapsed patch. |
| Head, face, hair fit, and ear layering | PASS | Actual ranges and inspected desktop/mobile rendering remain coherent. |
| Neck/collar continuity | PASS | Accepted states attach; floating-neck fixture blocks. |
| Acromion tangent continuity | PASS | Actual sampled join is continuous with no sign-reversing cusp. |
| Shoulder/deltoid/torso anatomy | **FAIL** | Low squared cap/container reading; neutral drop 80 is outside the controlling 24..60 range. |
| Advertised individual bounds | **FAIL** | Ten single-slider min/max states self-block. |
| Required negative fixtures | PASS | 10/10 blocked with intended families. |
| Mobile layout | PASS | 390 px stage remains centered, contained, and readable with overlay off. |

## Required recreation and retest

1. Choose and publish one controlling specification. If the new values are intended, update the character bible as an explicit new contract and submit that exact document for review; otherwise restore the 0.3.0 shoulder-drop and torso ranges and solve the shape within them. Do not let source/tests silently redefine the gate.
2. Re-author the trapezius–acromion–deltoid contour so the full visible shoulder reads anatomically at desktop and 390 px. Preserve C1 continuity and downstream taper without a late square cap or container silhouette.
3. Reconcile parameter limits with derived constraints. Every advertised individual min/max must be selectable, or its UI range must be narrowed/documented so the endpoint is not falsely presented as allowed.
4. Preserve the real visible bust deformation, broad zero-bust surface, fixed shoulder-pair support, and ear/hair/head improvements.
5. Rerun all 1,159 states, all ten fixtures, exact specification comparison, visible path/bust comparisons, and fresh overlay-off desktop/mobile captures.

Final decision: **FAIL**.
