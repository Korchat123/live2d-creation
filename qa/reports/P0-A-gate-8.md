# P0-A Gate A report — FAIL

- Feature tracker HEAD: `b717e3fe9db51e0e2c58dc2a3f83f8dda73dc693`
- Immutable code candidate: `d215f8d373c59d6197ac19bf57701d18e161ff8a`
- Review base: `b18c68e833ac0d9bbd6de1639c31420f45fc3ecd`
- Review branch: `review/p0-anime-geometry-gate-8`
- Governing contract: `standard-bust-v1/spec-0.7.0`
- Prior review: Gate 7 at `6bb77a1`
- Independent result: **FAIL**

This eighth candidate makes the structural change Gate 7 requested: the browser now renders one closed torso, two closed deltoids, and two closed upper arms in the declared arm-behind-torso, deltoid-over-attachment order. Real sampled overlaps exist, bust deformation is isolated to torso/chest, and every required mechanical check passes. Gate A still cannot pass. Fresh desktop and 390 px captures show those surfaces composing the same broad shield/container silhouette. The deltoids appear as cropped corner lobes, the upper arms as pale vertical bands inside a long perimeter, and the axilla cues as decorative seams. The semantic path provenance is also not disjoint, and the actual deltoid/torso occlusion is far larger than the declared 12-unit attachment depth.

## Exact candidate and execution

`b717e3f` changes only `FEATURE_TRACKER.md` over immutable candidate `d215f8d`. The candidate descends from the requested current `main` at `b18c68e`. No feature file was edited during review.

Executed evidence:

- `node --test test\\geometry.test.js test\\ui-contract.test.js`: 36/36 passed.
- `npm.cmd run test:browser`: 1/1 installed-Chromium test passed.
- A temporary independent CDP harness drove the real browser at `390 x 844`, selected all 1,159 evidence states, read actual SVG path data and boxes, checked visible widths, exercised every fixture, inspected topology/provenance/z-order, sampled physical surface intersections, and tested bust identity and isolation. It was removed after use.
- The supplied capture path produced all presets, representative bounds, adult-safe, worst-valid, and bust `0/.08/.50/.64` at desktop and 390 px with Measurements off. Captures were reviewed and remain temporary; hashes are recorded in `qa/evidence/P0-A-gate-8.json`.
- Source and DOM anti-cheat inspection found one computed SVG, no image/canvas renderer, no raster character asset, and no `Approved` shortcut.

Results:

- Actual rendered sweep: 1,159/1,159; 1,122 `Needs review`, exactly 37 documented correlated `Blocked`; zero state-name mismatch and zero non-finite path/box.
- Isolated endpoints: 48/48 render `Needs review`.
- Negative fixtures: 13/13 render `Blocked` with their intended defect family.
- Contract parity: character bible, executable spec, 24 controls, visible label, and stage dataset all expose `standard-bust-v1/spec-0.7.0` and the same ranges.
- Mobile readability thresholds pass across the sweep: minimum left-arm box width `33.20 CSS px`; minimum left-deltoid box width `38.62 CSS px`.
- Bust values `0/.08/.50/.64` produce distinct torso and chest paths; arm and deltoid paths remain identical. Both selectors change to `custom:bounded` after valid manual edits.
- Head, face, hair, ears, symmetry, containment, and responsive layout pass in the inspected preset/bound/worst-valid captures.

## Blocking findings

### A3 — Five surfaces still compose one shield/container

The new surfaces are real, but their visible composition is not credible canonical anatomy. Neutral, feminine, androgynous, masculine, shoulder-span min/max, shoulder-drop min/max, adult-safe, worst-valid, and all bust captures retain the same reading:

- the shoulder line runs into a broad rounded corner rather than a deltoid cap with an identifiable upper-arm direction;
- the deltoid is mostly hidden under/inside the composite and is visible as a small pale clipped lobe at the corner;
- the arm becomes a nearly vertical interior color strip extending to the crop while the external stroke remains a long container wall;
- the short inner curve begins from the pale lobe and reads as a seam printed on a sleeveless garment, not an axilla created by the relationship of arm and ribcage;
- at 390 px the subtle fill differences lose still more definition, leaving the same broad shield that Gate 7 rejected.

The masculine and worst-valid states exaggerate the defect. Bust `0` and `.64` correctly alter the covered torso field, but do not repair the shoulder/arm reading.

Passing union thresholds do not reverse the visual finding. Neutral composite width/acromion ratios at offsets `[0,40,90,150,230]` are `[1.00,1.05,1.01,0.96,0.93]`, but the denser neutral profile swells from `607.5` to `641.17` and then spends a `144`-unit maximum straight run tapering to `565.48`. This numerical envelope allows the broad rounded-rectangle result visible in the real browser. Gate A explicitly remains independently vetoable after automated success.

### A2 — Semantic provenance is not disjoint

The surface parents are correct, but their actual landmark chains cross owners and share anchors:

- `arm.left/right` use torso-owned `axillaLeft/right`;
- `shoulder.left/right` use torso-owned `anteriorFoldLeft/right`;
- the torso and each deltoid share both `shoulderMid` and `anteriorFold` chain entries;
- the torso and each arm share the corresponding `axilla` entry.

The test named `canonical provenance` checks that selected expected anchors are present; it does not reject foreign or shared anchors. Metadata declaring five owners therefore overstates isolation of the rendered paths. Separate attachment copies may occupy the same physical region, but each surface needs owner-local control points so downstream deformation cannot make a torso point directly author an arm or deltoid boundary.

### A2 — Declared overlap is not the actual overlap

All four declared overlap values equal `12`, and fresh fill hit-testing proves that the surfaces do physically overlap. However, the declaration is computed from selected coordinate deltas rather than the intersection of the filled surfaces. A two-canvas-unit grid over the neutral SVG found approximate simultaneous-fill extents:

| Attachment | Sampled overlap extent |
|---|---:|
| left/right arm–deltoid | about `60 x 28` |
| left deltoid–torso | about `38 x 136` |
| right deltoid–torso | about `36 x 134` |

The tall deltoid/torso overlap explains why the deltoid is reduced to a cropped visible lobe. It does not substantiate the contract's `8..24` hidden attachment depth. The next implementation must measure overlap normal to the actual attachment seam (or polygon-intersection depth), not infer it from two authored landmarks.

## Official workflow note

The character bible cites the official Cubism Glue workflow for separate Parts/ArtMeshes with hidden attachment overlap. This candidate now follows the broad layering idea, but attachment mechanics cannot approve the source drawing. The same bible separately requires the actual preview to read as one anatomically continuous person and rejects decorative seams and nonhuman silhouettes. The cited workflow therefore does not cure the blocking visual and provenance defects.

## Criterion matrix

| Gate A criterion | Result |
|---|---|
| Exact feature/code identities and tracker-only delta | PASS |
| Spec 0.7/control/UI parity | PASS |
| 36 Node tests and real Chromium test | PASS |
| 1,159-state actual-rendered sweep | PASS |
| 48 isolated endpoints and 13 fixtures | PASS |
| Exactly torso + two deltoids + two upper arms | PASS |
| Closed surfaces, physical intersection, declared z-order | PASS |
| Disjoint semantic provenance | **FAIL** |
| Actual attachment depth matches 8..24 contract | **FAIL** |
| Bust changes torso/chest but not arms/deltoids | PASS |
| Each arm/deltoid visible at least 12 CSS px | PASS |
| Human shoulder/deltoid/upper-arm/axilla/torso reading | **FAIL** |
| Head, hair, ears, and mobile containment | PASS |
| Anti-cheat and single-renderer provenance | PASS |

## Required recreation and retest

1. Build the surfaces from distinct anatomical constructions rather than slicing a container. A productive alternative is a ribcage/torso field, two independently directed upper-arm capsule fields, and rounded deltoid bridge fields; obtain the debug perimeter from their filled union instead of authoring a separate container-like outline.
2. Give each deltoid a visible lateral cap and insertion into a clearly directed upper arm. End torso ownership at a genuinely medial axilla so the ribcage edge and arm edge remain distinguishable without relying on fill tint.
3. Replace shared/cross-owned path anchors with owner-local attachment copies. Test that each surface's provenance chain contains only landmarks owned by that surface (or an explicitly versioned attachment namespace), while still proving physical overlap.
4. Measure actual filled intersection depth normal to each attachment seam and keep it within `8..24`; do not use landmark deltas as a proxy. Prevent the current `~134..136`-unit deltoid/torso occlusion.
5. Add a silhouette regression for the long nearly straight side and broad plateau, but retain overlay-off desktop and 390 px review. A scanline ratio alone cannot distinguish a human arm/ribcage construction from a rounded container with the same widths.
6. Preserve the passing state sweep, fixtures, bust isolation, selector identity, head/hair/ears, and mobile containment, then submit a fresh immutable candidate for Gate 9.

Final decision: **FAIL**.
