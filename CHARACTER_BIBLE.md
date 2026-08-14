# Standard bust v1 character bible

Version: `standard-bust-v1/spec-0.2.0`

Status: planning candidate. P0-A is blocked until an independent Gate A report passes this exact file version and candidate commit.

## Visual target

The target is a polished, front-facing anime VTuber bust with young-adult apparent age (`18+`). It must read as one anatomically continuous person before hair, clothing detail, color, or motion is added. It is not a realistic portrait, chibi child, super-deformed mascot, fashion sketch, paper doll, rectangular torso with a miniature face, or pasted bust.

The neutral construction is symmetric. Feminine, androgynous, and masculine presentation presets are bounded values on this one anatomy; gender presentation, bust, and maturity are independent dimensions.

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
| eye centers | `(435,260)`, `(565,260)` |
| nose / mouth | `(500,322)`, `(500,365)` |
| upper neck at jaw exit | `y = 416` |
| chin point | `(500,425)` |
| shoulder roots | approximately `(440,525)`, `(560,525)` |
| collar center | `(500,550)` |
| anatomical acromia | approximately `(196,585)`, `(804,585)` |
| covered bust apex line | approximately `y = 690` |

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
| upper-neck width / cranium width | `0.34` | `0.29..0.40` |
| collar span / cranium width | `0.44` | `0.38..0.49` |
| upper-neck width / jaw width | `0.47` | `0.42..0.62` |
| visible neck length / head height | `0.34` | `0.25..0.42` |
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
| chin shelf | near `415` | `0.28..0.40` |

The outline narrows monotonically below the cheek. Adjacent sampled half-width changes must not reverse or form an abrupt rectangular angle. Ears run from `y=225..240` to `y=320..340`, and both ear roots intersect the head silhouette.

## Face construction

- Eye-center distance / face width at the eye line: `0.43..0.53` (neutral `0.48`).
- Eye width: `54..70` (neutral `62`); eye height: `25..37` (neutral `31`).
- Eye width/height: `1.70..2.35`; left/right dimension delta: at most `2%`.
- Inner eye gap / eye width: `0.88..1.22`.
- Visible iris diameter / eye width: `0.52..0.72`; pupils remain inside an inset lid-safe gaze region.
- Eye-to-nose / eye-to-chin: `0.32..0.45`; nose-to-mouth: `0.20..0.32`; mouth-to-chin: `0.29..0.43`.
- Nose mark envelope: width `10..26`, height `8..26`.
- Closed mouth: width `30..56`, height `2..10`; mouth width / eye-center distance `0.23..0.43`.
- An open mouth width is at most `0.62 * eyeCenterDistance`; its height must preserve explicit nose and chin clearances.
- Mouth corners keep at least `0.12 * localJawWidth` clearance on both sides.

Correlated maturity rejection is mandatory when all three are true:

```text
eyeHeight / visibleFaceHeight > 0.115
jawWidth / craniumWidth < 0.68
mouthToChin / eyeToChin < 0.32
```

This rejects a chibi/childlike combination even when each isolated slider is inside its individual range.

## Neck, shoulders, torso, and bust

- Upper neck is narrower than the jaw and widens symmetrically and monotonically to a collar span that is not narrower than the upper neck.
- Trapezius curves join the collar/shoulder roots to the acromia. Acromion drop is `24..60` units.
- The torso curves outward/down to the acromia and then down/slightly inward. Outer width at `y=850` is less than garment shoulder width; rectangular shoulder walls are invalid.
- Covered bust apex offset is `0.13..0.18 * acromionSpan` from the center on each side.
- Inner sternum clearance is at least `0.08 * acromionSpan`; the outer covered envelope remains at least `12` units inside the torso/arm boundary.
- Zero/low bust is valid. Bust changes deform one continuous covered body/garment topology; they never translate two breast images.

## Hair fit construction

Hair is still geometry-only at Gate A. The executable fit arc contains center hairline, temple hairlines, crown samples, side-lock roots, front-bang root curve, and nape width/Y.

- Center hairline: `y=145..165`; temple hairline: `y=165..190`.
- The inner cap intersects or overlaps the sampled skull crown/temple arc; maximum halo gap is `0`.
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
- the maturity triple above;
- any pairwise or worst-valid bundle that breaks containment, ordering, curvature, continuity, or graph ownership.

## Automatic rejection

Gate A fails for a detached or miniature head; rectangular shoulders; face/sternum center disagreement; manual feature X/Y corrections; floating neck; collar discontinuity; pasted/detached bust; wig gap or wrong crown; non-monotonic or angular silhouette; out-of-bounds eye/iris/mouth/ear geometry; disconnected graph point; or any supported combined extreme that produces a nonhuman silhouette.

## Gate A evidence

An independent evaluator must review the actual geometry app at intended preview scale. Required reproducible evidence includes neutral and all presets, each min/max, pairwise combined extremes, a worst-valid combined bundle, measured silhouette intersections and local containment—not ratios alone—and rejection fixtures for miniature head, wig gap, floating neck, misplaced face, rectangular shoulders, detached bust, correlated maturity, and unsafe combined extremes.

A generated finished character, decorative art, manually corrected screenshot, or result from a renderer other than the inspected geometry app is invalid evidence. Automated success remains `Needs review`; this implementation cannot self-approve Gate A.

## Change control

Changing any target, range, tolerance, formula, or invariant requires a new spec version and independent Gate A review. Tests may become stricter without a version change; they cannot be weakened to accept a failure.
