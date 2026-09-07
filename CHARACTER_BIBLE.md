# Standard bust v1 character bible

Version: `standard-bust-v1/spec-0.8.0`

Status: planning candidate. P0-A is blocked until an independent Gate A report passes this exact file version and candidate commit.

## Visual target

The target is a polished, front-facing anime VTuber bust with young-adult apparent age (`18+`). It must read as one anatomically continuous person before hair, clothing detail, color, or motion is added. It is not a realistic portrait, chibi child, super-deformed mascot, fashion sketch, paper doll, rectangular torso with a miniature face, or pasted bust.

The neutral construction is symmetric. Feminine, androgynous, and masculine presentation presets are bounded values on this one anatomy; gender presentation, bust, and maturity are independent dimensions.

## Version 0.8 rationale and executable parity

This version preserves all 24 parameter triples from 0.7 but replaces its failed visible-composition algorithm. Gate 8 proved that five nominal surfaces can still compose a shield when an authored `character.root` outline bridges them, attachment points cross owners, deltoid/torso overlap is excessive, and tint bands or axilla strokes carry the visual separation. Version 0.8 removes that outline and those strokes. It uses owner-local torso, deltoid, and abducted upper-arm surfaces; measures their real filled overlap; and requires sustained negative axillary space below a connected shoulder bridge. The anatomy must remain readable when every body surface uses the same fill.

The following table is the parity source reviewed by tests. `src/spec.js`, the UI controls, evidence states, and README must expose this exact version and these exact min/max/neutral triples.

| Parameter key | Min | Max | Neutral |
|---|---:|---:|---:|
| headWidth | 260 | 280 | 270 |
| headAspect | 1.16 | 1.31 | 1.233 |
| shoulderHeadRatio | 2.05 | 2.48 | 2.25 |
| jawCraniumRatio | 0.67 | 0.75 | 0.72 |
| upperNeckHeadRatio | 0.31 | 0.40 | 0.34 |
| collarHeadRatio | 0.38 | 0.49 | 0.44 |
| neckLengthHeadRatio | 0.22 | 0.34 | 0.27 |
| shoulderDrop | 44 | 60 | 52 |
| templeCraniumRatio | 0.94 | 1.00 | 0.98 |
| cheekCraniumRatio | 0.86 | 0.94 | 0.90 |
| chinCraniumRatio | 0.31 | 0.40 | 0.34 |
| eyeCenterFaceRatio | 0.47 | 0.53 | 0.516 |
| eyeWidth | 59 | 69 | 62 |
| eyeHeight | 27 | 36 | 31 |
| irisEyeRatio | 0.52 | 0.72 | 0.62 |
| noseWidth | 10 | 26 | 16 |
| noseHeight | 8 | 26 | 14 |
| mouthWidth | 30 | 55 | 42 |
| mouthHeight | 2 | 10 | 4 |
| mouthChinShare | 0.31 | 0.42 | 0.36 |
| hairWidthHeadRatio | 1.12 | 1.32 | 1.20 |
| hairLiftHeadRatio | 0.06 | 0.15 | 0.10 |
| bustShoulderRatio | 0.00 | 0.64 | 0.54 |
| bustApexOffsetRatio | 0.13 | 0.18 | 0.155 |

## Coordinate and ownership contract

- Design canvas: `1000 x 1000`; origin top-left; positive Y points downward.
- Character center: `x = 500`; torso crop: `y = 970`.
- Every point is derived from the center, dimensions, ratios, and parent graph. Fixed neutral X coordinates never survive a dimension change.
- Face features inherit `head.root` or descendants. Bust and garment geometry inherit the same torso deformation field.
- No character part may contain a stage-global placement correction.

Canonical neutral landmarks, before allowed preset variation:

| Landmark | Neutral |
|---|---:|
| hair envelope top | `(500, 60)` |
| skull top | `(500, 92)` |
| center/temple hairline Y | `155 / 178` |
| brow / eye line | `222 / 260` |
| eye centers | approximately `(435,260)`, `(565,260)` |
| nose / mouth | `(500,322)`, `(500,365)` |
| upper neck at jaw exit | `y = 416` |
| chin point | `(500,425)` |
| shoulder roots | approximately `(440,501)`, `(560,501)` |
| collar center | approximately `(500,525)` |
| anatomical acromia | approximately `(196,553)`, `(804,553)` |
| covered bust apex line | approximately `y = 650` |

Because Y increases downward, the required junction ordering is:

```text
hairTop < skullTop < browLine < eyeLine < noseBase < mouthCenter
upperNeckJawExitY <= chinY < collarCenterY < acromionY < bustApexY < torsoCropY
leftAcromion < leftEar < leftEye < center < rightEye < rightEar < rightAcromion
```

The lateral jaw/neck junction is not forced into a generic centerline sequence.

## Global proportions

All ratios are measured from computed silhouette intersections and landmarks, never CSS boxes or labels.

| Measurement | Neutral target | Allowed range |
|---|---:|---:|
| anatomical acromion span / cranium width | `2.25` | `2.05..2.48` |
| bare-head height / cranium width | `1.23` | `1.16..1.31` |
| jaw-angle width / cranium width | `0.72` | `0.67..0.75` |
| upper-neck width / cranium width | `0.34` | `0.31..0.40` |
| collar span / cranium width | `0.44` | `0.38..0.49` |
| upper-neck width / jaw width | `0.47` | `0.42..0.62` |
| visible neck length / head height | `0.27` | `0.22..0.34` |
| hair envelope width / cranium width | `1.20` | `1.12..1.32` |
| hair rise / head height | `0.10` | `0.06..0.15` |
| covered bust envelope / acromion span | `0.54` | `0.00..0.64` |

Presentation targets and target envelopes:

| Preset | Acromion/head | Jaw/head | Upper neck/head | Bust/shoulder |
|---|---:|---:|---:|---:|
| Feminine | `2.14` (`2.10..2.18`) | `0.69` | `0.31` | `0.57` |
| Androgynous | `2.25` (`2.20..2.30`) | `0.72` | `0.34` | `0.50` |
| Masculine | `2.40` (`2.34..2.46`) | `0.75` | `0.38` | `0.44` |

Shoulder span means anatomical acromion span, not clothing padding or an arm/garment bounding box. Garment padding is at most `0.06 * headWidth` per side unless a separate padded family is authored.

## Multi-height head silhouette

The cranium width excludes ears. Sample widths are derived symmetrically around the center:

| Sample | Y region | Width / cranium width |
|---|---:|---:|
| temples | near `205` | `0.94..1.00` |
| cheeks | near `300` | `0.86..0.94` |
| jaw angle | near `375` | `0.67..0.75` |
| chin shelf | near `415` | `0.31..0.40` |

The outline narrows monotonically below the cheek. Adjacent sampled half-width changes must not reverse or form an abrupt rectangular angle. Ears run from `y=225..240` to `y=320..340`, and both ear roots intersect the head silhouette.

## Face construction

- Eye-center distance / face width at the eye line: `0.47..0.53` (neutral `0.516`, approximately 130 units).
- Eye width: `59..69` (neutral `62`); eye height: `27..36` (neutral `31`).
- Eye width/height: `1.70..2.35`; left/right dimension delta: at most `2%`.
- Inner eye gap / eye width: `0.88..1.22`.
- Visible iris diameter / eye width: `0.52..0.72`; iris and pupil geometry is clipped by an inset copy of the actual eye opening.
- Eye-to-nose / eye-to-chin: `0.32..0.45`; nose-to-mouth: `0.20..0.32`; mouth-to-chin: `0.31..0.42`.
- Nose mark envelope: width `10..26`, height `8..26`.
- Closed mouth: width `30..55`, height `2..10`; mouth width / eye-center distance `0.23..0.43`.
- An open mouth width is at most `0.62 * eyeCenterDistance`; its height must preserve explicit nose and chin clearances.
- Mouth corners keep at least `0.12 * localJawWidth` clearance on both sides.

Correlated maturity rejection scores five coupled signals. A candidate is rejected when high eye occupancy and at least two other signals cross their authored boundary:

```text
eyeHeight / visibleFaceHeight > 0.115
mouthToChin / eyeToChin < 0.32
jawWidth / craniumWidth < 0.68
upperNeckWidth / craniumWidth <= 0.31
acromionSpan / craniumWidth < 2.12
```

This rejects a chibi/childlike combination even when each isolated slider is inside its individual range.

## Neck, shoulders, torso, and bust

The topology follows the official Cubism workflow of separate Parts/ArtMeshes with hidden attachment overlap and shoulder Glue (`docs.live2d.com/en/cubism-editor-manual/glue/`). Pose construction likewise treats shoulder and elbow direction as distinct skeleton landmarks rather than inferring anatomy from a container perimeter.

- Upper neck is narrower than the jaw and widens symmetrically and monotonically to a collar span that is not narrower than the upper neck.
- Trapezius curves join the collar/shoulder roots to the acromia. The supported acromion drop is `44..60` units; the neutral target is `52`, keeping the bony landmark near `y=553` rather than the rejected low `y=581` cap.
- The bust is five closed semantic surfaces: one `torso.root`, paired `shoulder.left/right` deltoids, and paired `arm.left/right` upper arms. The arm surfaces render behind the torso, the deltoids render over both attachments, and every attachment has `8..24` hidden canvas units of overlap. Open guide curves cannot substitute for a surface.
- The landmark skeleton orders shoulder joint, deltoid apex, insertion, axilla, elbow direction, torso center, and hip direction. Torso ownership stops medial to the shoulder joint; no torso-owned contour may extend lateral to an acromion.
- There is no separately authored whole-body or `character.root` outline. The visible contour is the exposed boundary of the five filled semantic surfaces; it may contain separate arm and torso components below the axilla and must never bridge their negative space.
- Torso, deltoid, and arm paths use disjoint owner-local landmark IDs. Paired attachment-guide copies align within `1.5` units but remain independently owned. Provenance presence alone is insufficient: a surface containing a foreign-owned control is invalid.
- Actual filled overlap is sampled normal to each owner-local attachment guide. Every valid interior sample is `8..24` canvas units. Declared landmark deltas cannot substitute for measured intersection depth.
- The connected shoulder band has one filled union component. Below each axilla, the torso and paired arms form three components for a sustained run of at least `0.18 * headWidth`; each gap is at least `max(8, 0.035 * headWidth)` and at most `0.19 * headWidth`.
- Upper-arm centerlines abduct outward by `4..14 degrees`, retain `0.55..1.05` lower/upper width, and crop independently below the visible torso crop. Axillary gaps remain open to the crop; no shared flat baseline may close them.
- Deltoids must contribute exposed geometry outside both torso and upper arm: at least `0.08 * headWidth` wide, `0.18 * headWidth` high, and `0.012 * headWidth^2` in sampled area per side. Tint, opacity, mask, filter, internal seam, or decorative outline cannot count as exposure.
- At `390px`, each actually visible upper arm is at least `10 CSS px` wide and `24 CSS px` high, and each exposed deltoid is at least `8 CSS px` wide and `12 CSS px` high. The same-fill, no-internal-cue view must remain recognizably human.
- Outer torso width at `y=850` is `0.70..0.78` of garment shoulder width (neutral `0.72`). This stricter taper replaces the planning value `0.78..0.90`, whose upper half permits the independently observed slab/container silhouette.
- These are actual-fill requirements. Tests inspect each closed surface, disjoint ownership, physical attachment overlap, union component count, axillary negative space, arm direction/crop, deltoid exposure, z-order, and mobile visible pixels. Landmark metadata, raw bounding boxes, tint bands, or a decorative outline cannot satisfy them.
- Covered bust apex offset is `0.13..0.18 * acromionSpan` from the center on each side.
- Inner sternum clearance is at least `0.08 * acromionSpan`; the outer covered envelope remains at least `12` units inside the torso/arm boundary.
- Zero/low bust is valid. Bust upper, outer, apex, inner, and center anchors form one closed chest-owned envelope with continuous joins; at zero it collapses to the chest center without detached lobes.

## Hair fit construction

Hair is still geometry-only at Gate A. The executable fit arc contains center hairline, temple hairlines, crown samples, side-lock roots, front-bang root curve, and nape width/Y.

- Center hairline: `y=145..165`; temple hairline: `y=165..190`.
- The inner cap is part of one closed hair envelope and intersects or overlaps measured skull crown/temple samples; maximum signed halo gap is `0`.
- Hidden overlap is at least `maxProjectedDisplacement + 8` safety units.
- Side-lock and nape roots follow head sockets; they cannot stay at fixed neutral coordinates as the head changes.
- Hair back/side/front sublayers are one authored set. Cross-mixing remains disabled without an approved edge contract.

## Derived formulas and correlated limits

Representative ownership formulas:

```text
headLeftRight = centerX +/- headWidth / 2
acromionLeftRight = centerX +/- shoulderHeadRatio * headWidth / 2
jawLeftRight = centerX +/- jawRatio * craniumWidth / 2
upperNeckLeftRight = centerX +/- upperNeckRatio * headWidth / 2
bustApexLeftRight = centerX +/- bustApexOffsetRatio * acromionSpan
```

The implementation must reject or reconcile correlated extremes before rendering, including:

- maximum shoulder ratio with a head width that exceeds the safe canvas silhouette;
- maximum upper-neck width with minimum jaw width when upper-neck/jaw exceeds `0.62`;
- maximum hair width with shoulder/head negative-space failure;
- zero bust combined with either the minimum-head/narrow-lower-torso field or maximum-acromion frame; these two inherited correlated boundaries remain blocked even though each isolated endpoint is supported;
- the maturity triple above;
- any pairwise or worst-valid bundle that breaks containment, ordering, curvature, continuity, or graph ownership.

## Automatic rejection

Gate A fails for a detached or miniature head; rectangular shoulders; face/sternum center disagreement; manual feature X/Y corrections; floating neck; collar discontinuity; pasted/detached bust; wig gap or wrong crown; non-monotonic or angular silhouette; out-of-bounds eye/iris/mouth/ear geometry; disconnected graph point; or any supported combined extreme that produces a nonhuman silhouette.

## Gate A evidence

An independent evaluator must review the actual geometry app at intended preview scale. Required reproducible evidence includes neutral and all presets, each min/max, pairwise combined extremes, a worst-valid combined bundle, measured silhouette intersections and local containment—not ratios alone—and rejection fixtures for miniature head, wig gap, floating neck, misplaced face, rectangular shoulders, detached bust, correlated maturity, and unsafe combined extremes.

Evidence also covers every advertised isolated endpoint, zero/low/neutral/maximum bust, and the wedge-body, scalloped-bib, compact-shoulder-hook, fake-decorative-seam, and fused-arm-container fixtures. All presets and representative geometry extremes are captured at desktop and `390px` with the measurement overlay off. A manual control edit must replace both selectors' displayed identities with `custom:bounded` or `custom:reconciled`; stale preset evidence is invalid.

A generated finished character, decorative art, manually corrected screenshot, or result from a renderer other than the inspected geometry app is invalid evidence. Automated success remains `Needs review`; this implementation cannot self-approve Gate A.

## Change control

Changing any target, range, tolerance, formula, or invariant requires a new spec version and independent Gate A review. Tests may become stricter without a version change; they cannot be weakened to accept a failure.
