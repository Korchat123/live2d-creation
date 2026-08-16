# P0-A Gate A report — FAIL

- Candidate: `e5441c587997e76a4570addf3c129a5640f13cfc`
- Candidate branch: `origin/feat/p0-anime-geometry-spec`
- Review branch: `review/p0-anime-geometry-gate-2`
- Specification reviewed: `standard-bust-v1/spec-0.3.0`
- Previous Gate A report: `92e1421` (`P0-A-gate-1.md`)
- Independent result: **FAIL**

The recreation fixes the old declared-versus-rendered width mismatch, exposes the missing boundary evidence, and synchronizes state identity. It does not yet satisfy the required continuous young-adult torso/chest anatomy. Green automated checks do not override the visible and structural failures below.

## Exact candidate and reproducible evidence

The isolated review worktree was fast-forwarded without rewriting from `9b25a6c` to the exact pushed candidate. Both `HEAD` and `origin/feat/p0-anime-geometry-spec` resolved to `e5441c587997e76a4570addf3c129a5640f13cfc` before evaluation.

Commands run:

```text
npm.cmd test
$env:P0_CAPTURE_PATH='C:\Users\korch\AppData\Local\Temp\p0-gate-a-2-mobile-browser.png'; npm.cmd run test:browser
node .gate-a-review.mjs
```

The temporary independent CDP harness drove the real app in Chromium at `1440x1000`, selected all 1,159 entries in `#evidence-select`, read actual SVG `getBBox()` results and point-to-path distances, rejected non-finite output, exercised all 10 fixture buttons, captured the required desktop states, and then repeated layout inspection at `390x844`. The harness and browser evidence were kept outside the candidate and the harness was removed before this report commit.

Results:

- Candidate Node suite: 28/28 passed.
- Candidate real-Chromium mobile test: 1/1 passed.
- Independent selectable-state sweep: 1,159/1,159 rendered; 731 `Needs review`, 428 `Blocked`; no `NaN`, `undefined`, or `Infinity` output.
- Independent fixture sweep: all 10 fixtures rendered `Blocked` with their intended error family; no non-finite output.
- Evidence identity: no selected-state mismatch; preset states selected the matching preset, while non-preset states cleared the preset selection.
- Mobile: viewport and document width were both 390 px; the stage occupied x=12..378; measurement overlay defaulted off.
- Anti-cheating: the result is the inspected computed SVG. No raster character, canvas, flattened master, PSD, Live2D model binary, or hidden approval shortcut was found.

Actual rendered silhouette measurements:

| State | Head bbox width | Hair bbox width | Hair/head | Body bbox width | Body/head |
|---|---:|---:|---:|---:|---:|
| `preset:neutral` | 270.0 | 324.0 | 1.20 | 607.5 | 2.25 |
| `preset:feminine` | 270.0 | 324.0 | 1.20 | 577.8 | 2.14 |
| `preset:masculine` | 270.0 | 324.0 | 1.20 | 648.0 | 2.40 |
| `combined:worst-valid` | 280.0 | 369.6 | 1.32 | 694.4 | **2.48** |

Across all computed valid states, the actual rendered body/head maximum is **2.48**, the actual hair/head range reaches exactly `1.12..1.32`, and the sampled waist/body range is `0.85..0.86`. Required head, hairline, side-lock, nape, and ear-root landmarks are now serialized path endpoints rather than metadata-only control points. Coarse uniform browser length sampling reports a conservative nonzero distance between samples, but source-path endpoint inspection and the executable path sampler confirm endpoint membership.

## Blocking defects

### A3 — Accepted shoulder and torso silhouettes are still not believable continuous young-adult anatomy

The accepted neutral, feminine, masculine, adult-safe, and worst-valid captures retain long near-vertical outer walls immediately below each acromion. In the implementation, `deltoidOuterLeft.x` and `deltoidOuterRight.x` are set equal to their respective acromion X coordinates. The visible path then holds that X through the deltoid before turning inward toward the upper arm. This reads as a cut-off sleeveless garment or rigid container, not a trapezius/acromion/deltoid/upper-arm transition on one person.

The final candidate change bounds the visible bbox by moving the deltoid onto the acromion X coordinate. That makes the numeric body/head cap pass, but it does not solve local shoulder curvature. `rendered.wedgeBody` only checks waist width divided by whole-body bbox width, so it cannot reject the accepted vertical shoulder walls or abrupt acromion tangent. This violates the character bible’s continuous shoulder/torso rule and its rejection of rectangular/angular silhouettes.

The effect is especially conspicuous in the feminine preset: the top remains a broad straight-edged shoulder block while the lower crop narrows aggressively. At thumbnail and phone scale it reads as a head above a vase/bathtub-shaped block rather than a believable anime bust construction.

### A4 — The accepted chest is not one closed, continuous chest-owned envelope

The previous scalloped bib was not replaced with the required anatomical surface. The normal `chest.center` path is now four disconnected subpaths:

1. shoulder root → sternum → opposite shoulder root;
2. left outer bust → left apex → left inner bust;
3. right inner bust → right apex → right outer bust;
4. a separate lower rib curve.

There is no closing segment and no C0/C1 join between those pieces. The rendered `chest-field` is explicitly unfilled, so the visible output is a collection of floating guide strokes, not the closed covered chest surface required by `CHARACTER_BIBLE.md`. Its provenance list also omits the inner and outer bust anchors used by the path.

The `rendered.scallopedBib` validation samples only the first subpath before the next `M`, while the metadata continuity checks inspect landmark ordering rather than continuity of the rendered SVG. Consequently this disconnected accepted chest passes automatically. It is a structural failure, not an aesthetic preference.

## Major defect

### Ears remain unreadable in the real result

The ear paths now have valid measured bboxes and intersect their roots, but they are drawn before an opaque/semi-opaque hair cap whose envelope covers them. Neutral, presentation, worst-valid, and mobile captures do not show two distinct readable ears. At 390 px the ear path boxes measure about 11.87 × 35.67 px, yet their visible identity is lost under the cap. This does not satisfy Gate 1’s required recreation of distinct readable ear geometry at intended and phone scale.

## Gate 1 defect retest

| Prior defect | Result | Evidence |
|---|---|---|
| A1 rendered ratios differ from declarations | PASS | Actual head/hair/body bboxes realize the authored ratios; max body/head is 2.48. |
| A2 pointed metadata-only wig/hood | PASS | Outer cap, hairline, side locks, nape, and fit seam are executable paths; actual hair/head is 1.12..1.32. |
| A3 nonhuman head/body silhouette | **FAIL** | Head is materially improved, but accepted shoulder/deltoid/torso walls remain rigid and non-anatomical. |
| A4 scalloped bib instead of chest field | **FAIL** | The bib is gone, but the replacement is four disconnected open strokes rather than one closed continuous surface. |
| A5 missing/inconsistent evidence identity | PASS | Both boundary states are selectable; preset identity remains synchronized or is explicitly cleared. |

## Criterion matrix

| Gate A criterion | Result | Evidence |
|---|---|---|
| Exact pushed candidate / spec identity | PASS | Worktree and remote ref both resolved to the full candidate SHA; spec label is `spec-0.3.0`. |
| Anti-cheating / provenance | PASS | One computed SVG; no flattened character or alternative renderer. |
| Automated unit and real-browser execution | PASS | 28/28 Node, 1/1 candidate browser, 1,159-state independent Chromium sweep. |
| Head, face, and actual rendered ratios | PASS | Improved anime head; actual bboxes and endpoints now match the executable contract. |
| Hair cap / skull overlap / named fit points | PASS | Real cap width and construction endpoints are present; wig fixtures block. |
| Neck / head / collar continuity | PASS | Valid states join; floating-neck fixture blocks. |
| Trapezius / acromia / deltoids / torso | **FAIL** | Accepted visible path uses vertical acromion-to-deltoid walls and reads as a rigid body block. |
| Covered chest / bust continuity | **FAIL** | Accepted chest SVG is disconnected and open; validation checks the wrong representation. |
| Ears at intended and mobile scale | **FAIL** | Geometry exists but is visually swallowed by the hair cap. |
| Boundary, worst-valid, and state identity | PASS | All required states are exposed and synchronized. |
| Negative fixtures | PASS | All 10 block with intended families. |
| Mobile containment | PASS | No width overflow; stage centered and measurements off by default. |
| Independent approval state | PASS | Valid output remains `Needs review`; no self-approval path. |

## Required recreation and retest scope

1. Re-author the visible shoulder-to-arm contour with real local curvature/tangent constraints. Do not set the deltoid X equal to the acromion merely to cap the bbox. Add actual-path angle/curvature checks that reject the current accepted vertical-wall silhouette.
2. Replace the four open chest strokes with one closed covered chest surface. Its upper, outer, apex, inner, sternum, and lower-rib sections must be connected in the rendered path with explicit C0/C1 assertions across zero, low, neutral, maximum, and all presentation presets.
3. Make inner/outer bust anchors part of rendered path provenance, and validate continuity on the complete SVG path rather than only its first subpath or metadata ordering.
4. Establish explicit ear/hair occlusion: either reveal a readable ear portion or divide hair back/front groups so ears occupy the intended layer. Verify both at desktop stage scale and 390 px.
5. Submit a new immutable candidate and rerun all 1,159 selectable states, all 10 fixtures, exact visible-path measurements, desktop/presentation/worst-valid captures, and mobile review. Do not weaken `spec-0.3.0` or substitute a finished/generated image.

Final decision: **FAIL**.
