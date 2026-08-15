# P0-A Gate A report — FAIL

- Candidate: `129aa86e5d23e7e5aaf5c82cb4e8decee435581d`
- Candidate branch: `origin/feat/p0-anime-geometry-spec`
- Review branch: `review/p0-anime-geometry-gate-1`
- Specification reviewed: `standard-bust-v1/spec-0.3.0`
- Independent result: **FAIL**

Passing tests do not override the visual and measurement failures below. P0-A must remain unapproved, and M0 anatomy/art work must not use this candidate as its accepted base.

## Reproducible evidence

Commands run from an isolated worktree created directly from the exact candidate:

```text
git worktree add C:\Users\korch\AppData\Local\Temp\live2d-model-worktrees\p0-gate-a -b review/p0-anime-geometry-gate-1 129aa86
npm.cmd test
$env:P0_CAPTURE_PATH='C:\Users\korch\AppData\Local\Temp\p0-gate-a-mobile.png'; npm.cmd run test:browser
node .gate-a-browser.mjs
```

The temporary independent CDP harness drove the real UI in Chromium at `1440x1000`, selected every option exposed by `#evidence-select`, measured the actual SVG paths with `getBBox()`, captured representative states, clicked every negative-fixture button, and rejected `NaN`/`undefined` geometry. It was removed before this review commit.

Results:

- Node suite: 27/27 passed.
- Candidate browser harness at `390x844`: 1/1 passed; the SVG was centered and contained with no page-width overflow.
- Independent real-browser sweep: 1,157 rendered selector states; 730 `Needs review`, 427 `Blocked`; all eight required negative fixtures rendered and reported `Blocked` with their intended hard-failure family.
- Representative visual captures inspected: neutral, feminine, androgynous, masculine, worst-valid, phone neutral, and all eight negative fixtures.
- Anti-cheating scan passed: no raster images, canvas, PSD, model binary, or hidden finished-character asset is present; the center preview is the inspected SVG.

Actual live SVG measurements (stroke excluded by `getBBox()`):

| State | Declared head width | Rendered head bbox | Declared hair width | Rendered hair bbox | Rendered hair/head | Rendered body/head |
|---|---:|---:|---:|---:|---:|---:|
| `preset:neutral` | 270.00 | 264.60 | 324.00 (1.20x) | 266.21 | 1.006x | 2.439x |
| `combined:worst-valid` | 280.00 | 274.40 | 369.60 (1.32x) | 303.13 | 1.105x | 2.668x |

## Blocking defects

### A1 — Declared silhouette ratios are not measurements of the rendered SVG

`src/geometry.js` reports `headWidth`, `chinWidth`, and `hairWidth` from intended inputs. The visible head and hair paths do not realize those dimensions. In `src/app.js`, the alleged hair extents (`hairLeft`/`hairRight`) are only cubic Bezier control points, so they are not silhouette intersections. Likewise, `chinShelfLeft`/`chinShelfRight` are quadratic controls rather than sampled points on the head contour.

This violates the character bible’s rule that ratios are measured from computed silhouette intersections, and it lets automated validation pass geometry materially different from the visible result. The discrepancy is not rounding: neutral declares a 1.20 hair/head relationship while the real SVG is approximately 1.006.

### A2 — Hair construction is not the required executable fit arc and reads as a pointed wig/hood

The visible hair path does not traverse the canonical `hairlineCenter` or either `sideLockRoot` landmark. Those points exist as overlay metadata only. The narrow actual hair bbox has almost no lateral cap volume around the skull, then converges to a pointed crown. This is the same wig-fit failure the reset was intended to prevent, even though metadata-derived overlap checks pass.

### A3 — Valid head/body silhouettes fail the anime young-adult visual target

Neutral and all three presentation presets retain a long mannequin-like oval with a sharp chin nib. The worst-valid state makes this more pronounced. The body has a broad wedge silhouette with abrupt acromion/deltoid corners and side bulges; its actual width reaches 2.439x the rendered head in neutral and 2.668x in worst-valid. It reads as a small head attached to a superhero/garment block, not a polished front-facing anime VTuber bust with continuous young-adult anatomy.

The existing acromion/head metadata ratio does not catch this because the visible body bbox and visible head bbox are not the landmarks used by that ratio.

### A4 — Covered chest/bust construction reads as a giant scalloped bib, not a continuous anatomical chest field

The chest path begins at both shoulder roots, dips to the sternum, and closes around two pronounced lower lobes. This produces a large garment-like W/bib across the upper torso. The masculine preset changes the numeric bust ratio but retains the same breast-like lobe grammar. Gender presentation and bust may be independent, but each selected bust value must still produce anatomically credible covered volume rather than a decorative patch pasted across the body.

### A5 — Required evidence is incomplete and internally inconsistent in the real UI

`boundary:adult-safe` and `boundary:adult-blocked` are created by `evidenceStates()` but omitted by `buildEvidenceOptions()`, which only emits preset, bound, pair, and combined groups. They therefore cannot be reproduced from the evidence selector.

Selecting an evidence state updates the toolbar state name and sliders but leaves the left `Presentation preset` dropdown unchanged. The UI can consequently display two contradictory state identities. This weakens screenshot provenance and makes manual review error-prone.

## Major non-blocking defects to repair in the same recreation

- Ear curves are visually conflated with the dashed hair construction, and at phone scale they do not read as ears. Use distinct visible geometry and verify their roots against actual, not interpolated-only, head intersections.
- Desktop labels collide around the hairline, temples, eyes, jaw, collar, and chest in extreme/negative states. Phone defaults correctly hide them, but the evidence overlay is not consistently readable when enabled.
- The source and UI contain mojibake (`ยท`) where separators were intended. This is visible in SVG titles/error copy and should be corrected.
- A blocked slider combination is still drawn as a malformed character. Evidence fixtures may intentionally visualize failures, but the eventual creator path must reject/reconcile invalid combinations before applying them to the user’s result.

## Criterion matrix

| Gate A criterion | Result | Evidence |
|---|---|---|
| Exact candidate / spec identity | PASS | Worktree HEAD and app label match candidate and `spec-0.3.0`. |
| Anti-cheating / provenance | PASS | One computed SVG; no image/canvas/finished master or model binary. |
| Automated unit coverage | PASS | 27/27 tests. |
| Real browser execution | PASS | 1,157 selector states rendered; mobile harness passed. |
| Neutral and presentation presets | FAIL | All retain mannequin head and wedge torso; actual bbox ratios expose mismatch. |
| Min/max and pairwise extremes | FAIL | Browser sweep executes options, but validation is based on intended metrics rather than actual path intersections; valid worst case is visibly unacceptable. |
| Boundary and worst-valid evidence availability | FAIL | Worst-valid is selectable; both `boundary:*` states are absent from the UI. |
| Skull / jaw / face silhouette | FAIL | Declared sample widths are not actual contour samples; sharp chin/long oval remains. |
| Eyes / iris clipping / feature bounds | PASS | Real SVG uses inset eye clip paths and features remained contained in inspected valid states. |
| Neck / head / collar continuity | PASS | Neutral/presets join; floating-neck fixture is visibly separated and blocked. |
| Trapezius / acromia / torso taper | FAIL | Visible silhouette forms abrupt shoulder corners and a broad wedge despite passing intended landmark ratios. |
| Covered chest / bust continuity and appearance | FAIL | Technically closed but visually a scalloped bib/lobe patch, including masculine. |
| Hair cap / skull overlap / sockets | FAIL | Actual hair width contradicts declared ratio; required center hairline and side-lock roots are metadata-only. |
| Ears | FAIL | Unreadable/conflated at intended and mobile preview scales. |
| Negative fixtures | PASS | All eight report `Blocked` with intended error families. |
| Labels / state identity | FAIL | Collision in crowded states; preset and selected evidence can disagree. |
| Mobile center / clipping | PASS | 390x844 stage centered and contained; overlay defaults off. |
| Independent approval state | PASS | Valid geometry remains `Needs review`; no self-approval shortcut. |

## Required recreation and retest scope

1. Make the rendered path the source of truth. Add actual contour sampling/intersection tests for head, hair, jaw/chin shelves, shoulders, torso, chest, ears, and socket joins. Do not validate a control point or intended input as if it were a silhouette point.
2. Re-author the head contour to a coherent anime young-adult skull/cheek/jaw/chin shape. The chin-shelf samples must lie on the visible path, and valid extrema must not form a long oval or pointed nib.
3. Re-author hair as an actual fitted cap. Its real outer bbox/intersections must meet the authored hair/head range, and its path must explicitly use the center hairline, temple hairlines, side-lock roots, crown/inner-cap samples, and nape sockets.
4. Re-author trapezius, shoulder, deltoid, and torso curves against visible silhouette measurements. Add curvature/angle limits and a visual rejection fixture for the current wedge/superhero shape.
5. Replace the chest bib with a covered chest surface whose C0/C1 joins and cross-sections remain anatomical across zero, low, neutral, maximum, and presentation presets. Add a fixture matching the current scalloped-W failure.
6. Give ears distinct readable geometry and verify actual intersections at both root heights.
7. Expose both boundary states, synchronize or explicitly clear the preset selector when evidence/custom states are active, and correct label collisions/mojibake.
8. Resubmit a new immutable candidate. Gate A must rerun all 1,157 states plus new actual-path assertions, desktop/mobile captures, all existing fixtures, and the two new visual failure fixtures. Retest A1–A5 in full; do not narrow the spec or relax tolerances to pass.

Final decision: **FAIL**.
