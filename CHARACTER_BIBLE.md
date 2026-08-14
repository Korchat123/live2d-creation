# Standard bust v1 character bible

Version: `standard-bust-v1/spec-0.1.0`

Status: planning candidate. M0 anatomy work is blocked until an independent Gate A report passes this exact file version and commit.

## Visual target

The target is a polished, front-facing anime VTuber bust with young-adult proportions. It must read as one drawn person before hair, clothing detail, color, or motion is added. It is not a realistic portrait, chibi child, super-deformed mascot, fashion sketch, paper doll, or broad-shouldered body with a miniature face.

The neutral construction is symmetric. Presentation presets may change proportions only inside this contract; they do not select unrelated bodies or faces.

## Coordinate contract

All measurements use a `1000 x 1000` normalized design canvas. The character center line is `x = 500`. The visible bust occupies `x = 120..880`, `y = 55..970`.

| Landmark | Coordinate | Allowed neutral tolerance |
|---|---:|---:|
| hair envelope top | `(500, 60)` | `y +/- 12` |
| skull top under hair | `(500, 92)` | `y +/- 10` |
| brow/upper orbit line | `y = 222` | `+/- 8` |
| eye center line | `y = 260` | `+/- 8` |
| left/right eye centers | `(435, 260)`, `(565, 260)` | `x/y +/- 8` |
| nose base | `(500, 322)` | `x +/- 4`, `y +/- 8` |
| mouth center | `(500, 365)` | `x +/- 4`, `y +/- 8` |
| chin | `(500, 425)` | `x +/- 4`, `y +/- 10` |
| left/right ear centers | `(365, 274)`, `(635, 274)` | `x/y +/- 10` |
| neck at jaw exit | `(454, 416)`, `(546, 416)` | `x +/- 8` |
| neck at collar | `(440, 530)`, `(560, 530)` | `x +/- 10` |
| left/right shoulder tips | `(170, 585)`, `(830, 585)` | `x +/- 18`, `y +/- 14` |
| sternum/collar center | `(500, 550)` | `x +/- 5`, `y +/- 12` |
| bust apex line | `y = 690` | `+/- 24` |
| torso crop baseline | `y = 970` | fixed |

The base head silhouette excludes hair. Its maximum width is `270 +/- 12`; skull-top-to-chin height is `333 +/- 12`. The cranium continues behind front hair rather than ending at the hairline.

## Required ratios and ranges

Ratios are computed from landmarks and silhouette bounds, not CSS boxes or declared labels.

| Measurement | Neutral target | Allowed presentation range |
|---|---:|---:|
| shoulder span / bare-head width | `2.44` | `2.15..2.65` |
| bare-head height / bare-head width | `1.23` | `1.16..1.31` |
| jaw width / cranium width | `0.72` | `0.64..0.80` |
| neck width / bare-head width | `0.44` | `0.36..0.52` |
| visible neck length / bare-head height | `0.34` | `0.25..0.42` |
| inter-eye distance / face width at eyes | `0.48` | `0.43..0.53` |
| single eye width / inter-eye distance | `0.48` | `0.41..0.56` |
| eye-to-nose / eye-to-chin | `0.38` | `0.32..0.45` |
| nose-to-mouth / eye-to-chin | `0.26` | `0.20..0.32` |
| mouth-to-chin / eye-to-chin | `0.36` | `0.29..0.43` |
| hair width / bare-head width | `1.20` | `1.12..1.32` |
| hair height above skull / head height | `0.10` | `0.06..0.15` |
| covered bust width / shoulder span | `0.54` | `0.42..0.64` |

Outside any allowed range is a hard failure. Combined extremes are clamped or rejected before rendering.

## Landmark ordering invariants

For every supported state:

```text
hairTop < skullTop < browLine < eyeLine < noseBase < mouthCenter < chin
chin <= neckJawExit < collarCenter < shoulderLine < bustApex < torsoCrop
leftShoulder < leftEar < leftEye < centerLine < rightEye < rightEar < rightShoulder
```

Pupils stay inside eyes; brows stay above lids; the mouth keeps `24` units of jaw clearance per side; the neck stays inside jaw and collar; shoulders descend outward `18..70` units; bust centers remain symmetric and inside the torso. Face features inherit `head.root` or a descendant socket and never use stage-global corrections.

## Presentation envelopes

| Preset | Shoulder/head | Jaw/cranium | Neck/head | Bust/shoulder |
|---|---:|---:|---:|---:|
| Feminine | `2.30` | `0.69` | `0.40` | `0.57` |
| Androgynous | `2.42` | `0.72` | `0.44` | `0.50` |
| Masculine | `2.56` | `0.77` | `0.49` | `0.44` |

These are bounded parameter bundles on one anatomy graph, not unrelated replacement images.

## Hair fit

Hair fits `skull.top`, `temple.left/right`, `ear.left/right`, `nape.left/right`, and `head.root`. Back hair has at least `20` units of hidden overlap. Front hair follows and overlaps the skull arc with no halo gap. A hairstyle is one authored back/side/front set; cross-mixing is disabled without a separately approved edge contract. Fit is checked at every head width/height extreme, without nonuniform force-scaling.

## Neck, bust, and outfit fit

The body base owns shoulders, torso, covered bust, and collar sockets. Bust controls deform the covered base and garment together; they never translate a breast image. Outfits attach to shoulder, side-torso, collar, and torso sockets. The collar provides `8..28` units clearance per side. Whole-outfit nonuniform scaling above `3%` means incompatibility and requires recreation.

## Automatic rejection

Gate A or B fails if the head is detached, miniature, or stretched; shoulders form a rectangular wall; face and sternum center lines disagree; facial features need manual X/Y correction; neck floats or misses the collar; bust is pasted or leaves the torso; hair has a wig gap or wrong crown; an outfit paints over failed anatomy; or any valid preset/combined extreme produces a nonhuman silhouette.

## Gate A evidence

Before M0 implementation, an independent evaluator must approve this versioned contract plus a reproducible geometry-only front bust, overlays for neutral and all presets, min/max and pairwise combined extremes, computed ratio output, and rejection fixtures for a miniature head, wig gap, floating neck, misplaced face, rectangular shoulders, and detached bust. A generated finished character or manually adjusted screenshot is invalid evidence.

## Change control

After Gate A passes, changing a target, range, tolerance, or invariant requires a new version and new Gate A review. Tests may become stricter without a version change; they cannot be weakened to accept a failed result.
