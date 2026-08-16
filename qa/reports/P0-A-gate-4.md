# P0-A Gate A report — FAIL

- Candidate: `8a09c705bdc757533d4d8b161b292b957581fa53`
- Candidate branch: `origin/feat/p0-anime-geometry-spec`
- Review branch: `review/p0-anime-geometry-gate-4`
- Specification: `standard-bust-v1/spec-0.3.0`
- Prior review: Gate 3 at `0472e00` (`P0-A-gate-3.md`)
- Independent result: **FAIL**

The fourth candidate removes the literal acromion tangent reversal, makes a broad torso-owned closed ribcage field, preserves readable ears, and keeps zero bust from collapsing into a small patch. It still does not meet Gate A. The visible shoulder/upper-arm silhouette remains a long slab/container, and the bust parameter has no effect on either visible body geometry or the optional chest field. Hiding the invariant field with Measurements off makes the normal result cleaner, but it also means a required anatomy control changes only metadata and hidden points rather than the computed character.

## Exact candidate and reproducible evidence

The clean feature worktree `HEAD` and `origin/feat/p0-anime-geometry-spec` both resolved to the immutable candidate before evaluation. The review branch and worktree were created separately from `main`; no feature file was modified.

Commands run:

```text
npm.cmd test
$env:P0_CAPTURE_PATH='C:\Users\korch\AppData\Local\Temp\p0-gate-a-4-candidate-mobile.png'; npm.cmd run test:browser
node .gate-a-review.mjs
node --input-type=module -e <independent visible-path comparison>
git diff --check e1fa52e..8a09c70
```

The temporary CDP harness drove the real app in installed Chromium at `1440x1000` and `390x844`. It selected every evidence option, read actual SVG bounding boxes and paths, exercised every fixture, inspected state identity and non-finite output, measured ear rectangles, captured presets/bounds/worst-valid with Measurements both off and on, and inspected the DOM for alternate renderers. It was removed before this report commit. Capture hashes and compact measurements are recorded in `qa/evidence/P0-A-gate-4.json`; PNG files remain temporary evaluator artifacts.

Results:

- Candidate Node suite: 32/32 passed.
- Candidate real-Chromium mobile test: 1/1 passed.
- Independent exposed-state sweep: 1,159/1,159 rendered; 730 `Needs review`, 429 `Blocked`; no non-finite geometry and no state-identity mismatch.
- Negative fixtures: 10/10 rendered `Blocked` and each contained its intended defect family.
- Actual rendered exposed-state hair/head range: `1.1183..1.3200`; body/head range: `2.0469..2.4800` (browser floating-point bounds around authored limits).
- Mobile containment: viewport/document width `390`; stage `x=12..378`.
- Flattening/approval anti-cheating: no stage image, canvas, raster character asset, rig binary, alternate renderer, or `Approved` shortcut.
- Ears: both outer ears and inner-ear strokes remain visibly readable at desktop and phone scale.

## Blocking defects

### A3 — Exact C1 at the acromion does not cure the slab/container silhouette

The new `openSpline` gives the incoming and outgoing acromion cubics the same vertical derivative. Source-command inspection confirms that the former sign-reversing cusp is gone, so this part of the Gate 3 defect is fixed.

The whole accepted contour is nevertheless still non-anatomical. Neutral, feminine, masculine, both shoulder bounds, worst-valid, and their phone captures show a broad nearly horizontal shoulder shelf turning into long, almost upright sides. The result reads as a head attached to a sleeveless vase, tunic, or container rather than one continuous trapezius–acromion–deltoid–upper-arm/torso construction.

Actual sampled left-outline X values make the issue concrete. In neutral the contour moves only from about `x=224.0` at `y=665` to `x=230.3` at `y=785`: roughly six canvas units inward over 120 vertical units. Feminine moves about four units and masculine about nine over the same run. The local validator's `shoulderMaxStraightRun <= 176` threshold accepts these visibly upright runs and does not test whether the overall top/side transition reads as a shoulder and upper arm. The desktop and 390 px captures confirm that the numeric pass is not a visual pass.

This still violates the character bible's automatic rejection of rectangular/angular shoulder anatomy and the Gate A requirement for a believable young-adult bust silhouette.

### A4 — Bust controls do not deform any rendered surface

The recreated chest topology is broad, closed, C1, owned by `torso.root`, and no longer collapses at zero. But its boundary is calculated only from sternum/rib/torso landmarks. The six bust landmarks appear solely in provenance and containment checks; they do not participate in the visible chest commands. The body path likewise contains no bust-dependent geometry.

An independent comparison at `bustShoulderRatio = 0`, `.08`, `.50`, and `.64` found:

- `bustEnvelopeWidth` correctly changes from `0` through `388.8`;
- the complete chest `d` string is identical at every value;
- the complete body `d` string is identical at every value;
- the chest bbox is identical: approximately `542.754 x 207` at `x=228.623`, `y=524.808`;
- min/max browser screenshots with Measurements off are visually identical in the character stage; with Measurements on, only internal bust landmark dots move inside the unchanged dashed field.

Moreover, `app.js` renders the chest field only inside the optional Measurements overlay and gives it `fill:none`. This is acceptable for a debug guide only if the real covered body visibly deforms. Here it does not. The normal preview therefore hides the only chest-related path while the bust slider changes no actual composed result. That conflicts directly with the anatomy-first contract that bust controls deform the covered base/garment together and with the evidence rule that the app display—not metadata or a hidden guide—must demonstrate the selected state.

### Supported in-range pair newly self-blocks on the shoulder workaround

The state `pair:shoulderHeadRatio:min+shoulderDrop:min` now becomes `Blocked` solely by `rendered.shoulderStraightRun`. Gate 3 reported 731 reviewable states and 428 blocked; this candidate reports 730/429. Both component bounds are selectable authored anatomy values, and no correlation rejecting their combination is documented in the spec. This reinforces that the contour/threshold workaround has not produced one geometry that survives its advertised parameter envelope.

## Prior-defect retest

| Gate 3 item | Result | Evidence |
|---|---|---|
| acromion tangent reversal/cusp | PASS | Incoming/outgoing cubic controls share the exact derivative at each acromion. |
| shoulder/deltoid slab | **FAIL** | Accepted silhouettes retain long near-vertical sides and a container-like outline at all presets and phone scale. |
| floating bib / zero-bust patch | PASS structurally | One broad, closed torso-owned field persists at zero and avoids the old stem/lobes or triangle. |
| chest/bust deformation | **FAIL** | Chest and body path strings are invariant from zero to maximum bust; only hidden landmarks move. |
| ear readability | PASS | Pink ear shapes and inner-ear strokes remain readable through the hair split. |

## Criterion matrix

| Gate A criterion | Result | Evidence |
|---|---|---|
| Exact pushed candidate / spec identity | PASS | Clean immutable candidate and remote ref match; spec is 0.3.0. |
| No flattened/generated result or self-approval | PASS | Computed SVG only; no raster/canvas/alternate result and no `Approved` path. |
| Honest visible parameter propagation | **FAIL** | Bust controls change metadata/hidden landmarks but no visible body or chest path. |
| Unit and real-browser execution | PASS | 32/32 Node, 1/1 candidate browser, 1,159-state independent Chromium sweep. |
| Head, face, hair fit, and ratios | PASS | Rendered ranges remain bounded and executable paths own their fit landmarks. |
| Ear geometry and occlusion | PASS | Both ears and inner details remain legible at desktop and 390 px. |
| Neck/collar continuity | PASS | Accepted states attach and the floating-neck fixture blocks. |
| Acromion tangent continuity | PASS | Exact shared derivative removes the former cusp. |
| Shoulder/deltoid/upper-arm silhouette | **FAIL** | Long upright side runs preserve the sleeveless slab/container reading. |
| Torso-owned chest topology at zero bust | PASS | Broad closed C1 field does not collapse or float as a small patch. |
| Covered bust deformation across range | **FAIL** | Zero, low, neutral, and max have identical chest and body paths. |
| Boundary/extreme support | **FAIL** | One newly blocked in-range shoulder/drop pair exposes the contour limit. |
| Negative fixtures | PASS | 10/10 block with intended families. |
| Mobile containment | PASS | Stage is centered and contained at 390 px. |

## Required recreation and retest

1. Re-author the body silhouette as a believable trapezius–shoulder cap–deltoid–upper arm/side-torso contour. Keep the corrected acromion C1 join, but eliminate the long upright container sides. Evaluate the complete visible outline, not only a local tangent, three widths, or a permissive straight-run cap.
2. Make bust volume and height deform actual visible covered-body geometry and the same torso-owned chest field. Internal provenance/containment is not enough. Zero, low, neutral, and maximum must produce distinct, continuous path geometry without becoming breasts pasted onto a torso.
3. Keep Measurements as a debug overlay, but prove every normal anatomy control in the default preview. Add a test that body/chest visible geometry changes for nonzero bust deltas and that min/max stage captures are not identical.
4. Resolve or explicitly specify/clamp the `shoulderHeadRatio:min + shoulderDrop:min` correlation; do not silently reduce the supported envelope through a validator threshold.
5. Preserve the fixed ear layering, broad zero-bust topology, and exact acromion continuity. Rerun all 1,159 states, all fixtures, visible-path comparisons, desktop/presentation/bounds/worst-valid captures, and fresh 390 px review.

Final decision: **FAIL**.
