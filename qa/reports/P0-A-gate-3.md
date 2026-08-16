# P0-A Gate A report — FAIL

- Candidate: `e1fa52e894c18d1583fe436834cc91280a2cd2ad`
- Candidate branch: `origin/feat/p0-anime-geometry-spec`
- Review branch: `review/p0-anime-geometry-gate-3`
- Specification: `standard-bust-v1/spec-0.3.0`
- Prior review: Gate 2 at `070c878` (`P0-A-gate-2.md`)
- Independent result: **FAIL**

This recreation fixes the disconnected chest-path structure and makes both ears visibly survive the back/front hair split. It also replaces the former literal acromion-to-deltoid vertical segment with a progressively narrowing contour. Those changes are real, but the visible result still fails the contract: the shoulder junction remains angular and slab-like, while the closed chest field reads as a floating bib/moustache rather than a continuous covered chest surface. Automated success cannot override those blocking visual defects.

## Exact candidate and reproducible evidence

The feature worktree was clean and both its `HEAD` and the pushed feature ref resolved to the immutable candidate above. The evaluator branch was created separately from current `main`; no feature file was modified.

Commands run:

```text
npm.cmd test
$env:P0_CAPTURE_PATH='C:\Users\korch\AppData\Local\Temp\p0-gate-a-3-candidate-mobile.png'; npm.cmd run test:browser
node .gate-a-review.mjs
git diff --check e1fa52e^ e1fa52e
```

The temporary independent CDP harness drove the real app in Chromium. It selected every one of the 1,159 exposed evidence states, measured actual SVG `getBBox()`, `getTotalLength()`, `isPointInFill()` shoulder intersections, path closure/fill, ear screen bounds, state identity, and non-finite output. It exercised all 10 negative fixtures, captured neutral, all presentation presets, the adult-safe boundary, worst-valid bundle, and head/hair/shoulder/bust bounds at desktop size, then captured neutral, feminine, masculine, and worst-valid states at 390 px. The harness was removed before this report commit. Capture hashes and compact measurements are in `qa/evidence/P0-A-gate-3.json`; PNGs remain temporary review artifacts rather than production assets.

Results:

- Candidate Node suite: 31/31 passed.
- Candidate real-Chromium mobile test: 1/1 passed.
- Independent exposed-state sweep: 1,159/1,159 rendered; 731 `Needs review`, 428 `Blocked`; no non-finite SVG bounds.
- Evidence identity: 0 mismatches.
- Negative fixtures: 10/10 rendered `Blocked` with the intended defect family.
- Actual rendered valid-state hair/head range: `1.1183..1.3200`; body/head range: `2.0469..2.4800` (browser floating-point bounds around the authored `1.12..1.32` and `2.05..2.48`).
- Mobile containment: viewport/document width `390`; stage `x=12..378`; the candidate's fresh-mobile test verified measurement labels default off.
- Anti-cheating: one computed SVG; no image, canvas, generated/flattened character, PSD, rig binary, alternate renderer, or self-approval status was present.

Representative actual filled-body widths below the acromion, measured with browser `isPointInFill()` at `+24/+48/+72` units:

| State | Body bbox width | +24 | +48 | +72 |
|---|---:|---:|---:|---:|
| neutral | 607.5 | 588 | 576 | 564 |
| feminine | 577.8 | 558 | 546 | 534 |
| masculine | 648.0 | 628 | 616 | 604 |
| worst-valid | 694.4 | 676 | 660 | 648 |

The progressive decrease proves the old exact vertical wall is gone. It does not prove that the local join is visually natural.

## Blocking defects

### A3 — The shoulder/acromion topology remains angular and slab-like

At neutral, every presentation preset, both shoulder bounds, worst-valid, and 390 px, each shoulder slope reaches a pointed acromion and immediately reverses into a long near-straight side. This reads as the corner of a sleeveless board/container, not a continuous trapezius–acromion–deltoid–upper-arm transition.

The source explains the visible cusp. The final quadratic approaching the left acromion has an incoming direction toward the outer left, while the following cubic's first control point is seven units inward and 18 units down. The horizontal tangent reverses sign at the shared endpoint instead of maintaining a smooth shoulder join. The current checks inspect only the outgoing cubic tangent and progressive widths at three Y values; they never compare the incoming and outgoing tangents at the acromion. Therefore an accepted contour can pass while retaining the sharp corner seen in every capture.

This violates the spec's rejection of an angular silhouette and its requirement that the torso curve through the acromion and down/inward as believable continuous anatomy.

### A4 — The closed chest path is still a floating bib, not a covered chest surface

The structural Gate 2 defect is partly fixed: accepted states now contain exactly one `M`, a terminal `Z`, a non-`none` fill, and continuous cubic joins. However, closure alone does not make the visible perimeter anatomical.

The path walks sternum → inner/apex/outer right bust → lower ribs → outer/apex/inner left bust and applies a generic closed spline. At normal and maximum bust this produces a narrow center stalk with two lateral lobes—the visible silhouette reads as a translucent moustache/bra pasted inside the torso. At `bound:bustShoulderRatio:min`, the six bust anchors collapse to the sternum but the lower-rib anchors remain wide and more than 200 units below it, leaving a separate triangular/teardrop patch (`171.1 × 214.8` SVG units) instead of a neutral chest field. At maximum bust the patch grows to `397.2 × 207.7` and retains the same floating lobe topology.

The validator proves endpoint membership, one-subpath closure, and tangent equality, but does not test whether the surface joins the upper torso/chest boundary, avoids a narrow stem, or has a non-bib topology at zero/low bust. This fails the explicit requirement that the result be one continuous covered chest surface rather than a bib or floating guide.

## Prior-defect retest

| Gate 2 item | Result | Evidence |
|---|---|---|
| shoulder vertical wall | **FAIL (improved)** | Actual widths now narrow progressively, but the acromion remains a hard tangent reversal followed by slab-like sides. |
| disconnected/open chest | **FAIL (improved)** | One closed C1 path now exists, but its visible topology remains a floating bib and collapses to a triangular patch at zero bust. |
| unreadable ears | PASS | Pink outer ears plus inner-ear curves remain distinct between hair-back/head/hair-front at desktop and 390 px. |

## Criterion matrix

| Gate A criterion | Result | Evidence |
|---|---|---|
| Exact pushed candidate / spec identity | PASS | Clean immutable `e1fa52e894c18d1583fe436834cc91280a2cd2ad`, spec 0.3.0. |
| Anti-cheating / provenance | PASS | Actual computed SVG only; no flattened/generated final character or approval shortcut. |
| Unit and real-browser execution | PASS | 31/31 Node, 1/1 candidate browser, 1,159-state independent sweep. |
| Head, face, ratios, and maturity rejection | PASS | Actual rendered ranges bounded; adult-blocked correlation rejects. |
| Hair fit and ear layering | PASS | Executable fit geometry; both ears visibly readable at desktop and phone scale. |
| Neck/collar continuity | PASS | Accepted states join; floating-neck fixture blocks. |
| Shoulder/deltoid/torso silhouette | **FAIL** | Visible acromion cusp and long slab sides remain; no incoming/outgoing tangent continuity check. |
| Covered chest/bust surface | **FAIL** | Mathematically closed but visibly bib-like; zero bust leaves a floating triangular field. |
| Boundary, extremes, state identity | PASS | All exposed states render and identity stays synchronized. |
| Negative fixtures | PASS | 10/10 blocked with intended error families. |
| Mobile layout | PASS | 390 px contained/centered and readable; overlay defaults off on fresh mobile load. |
| Independent approval state | PASS | Valid output remains `Needs review`; evaluator performed the decision. |

## Required recreation and retest

1. Re-author the shoulder join with continuous incoming/outgoing tangent direction through each acromion; round the deltoid transition and eliminate the visible corner at desktop and phone scale. Add an actual-path acromion join-angle/C1 or bounded-curvature check, not only three downstream widths.
2. Re-author the chest as a torso-connected deformation field. Do not connect semantic bust landmarks in an order that creates a stem-and-lobes perimeter. At zero bust, the chest field must remain a neutral ribcage/upper-torso surface without a floating triangle; increasing bust should deform that same surface without producing a bra/moustache outline.
3. Add visual/topological assertions for zero, low, neutral, max, all presets, and worst-valid: upper attachment width, center-neck/sternum transition, absence of a narrow stem, and containment/continuity with the torso field.
4. Preserve the now-correct ear layering and rerun the full 1,159 states, all fixtures, desktop/presentation/boundary captures, and fresh 390 px review.

Final decision: **FAIL**.
