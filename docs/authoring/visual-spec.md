# Reference Avatar Visual Specification

Status: approved Phase A baseline  
Applies to: first-party Open 2D Avatar reference character  
Asset policy: this specification uses no external character, franchise, artist,
font, or image reference. Artwork derived from it must be original and recorded
in the rights manifest before integration.

## Decision labels

- **Technical default**: a measurable starting constraint for implementation.
  Phase A review may change it, but the approved value must remain explicit.
- **Creative decision - approval required**: subjective art direction that must
  be selected by a human before final artwork begins.

## Original character direction

**Creative decision - approval required.** The proposed character is an
approachable, non-photorealistic digital guide with a compact upper-body
silhouette. The design should read as attentive and capable rather than
childlike, corporate, or genre-specific. Proposed identifying elements are:

- a rounded, asymmetric hair silhouette with one deliberate side notch;
- a simple collar-and-jacket shape with a small geometric chest emblem;
- large, readable eyes and brows designed for gaze and expression clarity;
- no logos, uniforms, culturally specific regalia, celebrity resemblance, or
  visual quotation of an existing character;
- restrained surface detail so motion remains legible at small display sizes.

Human approval must select the character's perceived age range, presentation,
hair shape, outfit geometry, emblem, skin range, and final palette. Approval
means accepting an original character sheet, not merely this written proposal.

## Canvas and coordinate defaults

**Technical defaults.**

| Item                  | Proposed default                                        |
| --------------------- | ------------------------------------------------------- |
| Art canvas            | 2048 x 2048 logical pixels, transparent                 |
| Origin                | Canvas center; positive X right, positive Y down        |
| Neutral head center   | `(1024, 660)`                                           |
| Neutral eye line      | Y `620`, subject to approved proportions                |
| Runtime framing       | Head and upper torso, centered                          |
| Primary safe frame    | X `420..1628`, Y `120..1940`                            |
| Motion overscan       | At least 160 px beyond visible silhouette on every side |
| Preview aspect ratios | 1:1 required; 16:9 and 9:16 crop checks required        |
| Authoring color space | sRGB                                                    |
| Source precision      | 8-bit RGBA minimum                                      |

The origin, axis direction, and authored dimensions are technical contracts.
Exact landmark coordinates may move with the approved character sheet, but must
be frozen before rigging.

## Proportions and silhouette

**Technical defaults.**

- Neutral subject height occupies 86-90% of the square canvas.
- Head, including hair, occupies 40-46% of subject height.
- Shoulder width occupies 50-62% of canvas width.
- Both eyes, mouth, jaw, neck, and shoulder outline remain recognizable at a
  128 x 128 preview.
- The neutral silhouette retains at least 48 px of transparent separation from
  the primary safe frame.
- Hair, face, neck, and torso must not rely on identical values to separate
  overlapping forms.

**Creative decisions - approval required.**

- final head-to-body ratio and facial landmark placement;
- asymmetric feature and dominant silhouette direction;
- outfit cut, collar height, emblem form, and visible accessories;
- whether ears are visible and whether hair covers either eye at neutral.

The approved front pose must be balanced enough for bidirectional head motion.
No permanent element may conceal a whole eye, both brows, or the mouth because
these are required communication channels.

## Palette proposal

**Technical defaults.**

- Define named color tokens rather than sampling colors between layers.
- Meet WCAG 2.2 contrast guidance for any controls or text derived from the
  palette; character artwork itself must remain distinguishable in grayscale.
- Reserve one accent family for semantic emphasis, not continuous flashing.
- Avoid fully black shadow fills and fully white highlights to preserve range.
- Validate the neutral pose under common red-green and blue-yellow color-vision
  simulations.

**Creative decision - approval required.** Select one original palette and
record its final sRGB values. A proposed role-based starting set is:

| Token           | Proposed value | Role                          |
| --------------- | -------------- | ----------------------------- |
| `ink`           | `#263047`      | outlines and darkest features |
| `hair-base`     | `#3D4A68`      | primary hair mass             |
| `hair-light`    | `#64759C`      | hair planes                   |
| `skin-base`     | `#D99B7B`      | provisional skin role only    |
| `skin-shadow`   | `#B96F62`      | provisional skin shadow role  |
| `outfit-base`   | `#E8EDF2`      | jacket or shirt               |
| `outfit-shadow` | `#AEBAC8`      | garment separation            |
| `accent`        | `#36B8A5`      | emblem and limited highlight  |
| `eye`           | `#396E80`      | iris                          |

Skin values are placeholders, not a decision about ethnicity. The human review
must approve an inclusive final appearance without using a real person as an
unrecorded reference.

## Texture and delivery budgets

**Technical defaults.**

- Maximum texture dimension: 2048 x 2048 for the reference avatar.
- Preferred runtime atlases: two or fewer 2048 x 2048 RGBA textures.
- Hard decoded texture-memory target: 32 MiB at 1x assets.
- Compressed first-party avatar bundle target: 5 MiB or less.
- Source artwork may exceed runtime size but is never loaded by the runtime.
- Keep at least 8 px transparent padding around packed regions and use edge
  extrusion appropriate to the renderer.
- Do not upscale raster source during export.

These budgets are approved as the Phase A baseline. They must be copied into
validator limits and tested in CI before the Phase B gate.

## Pose and crop acceptance

**Technical defaults.** The character sheet must include:

1. neutral front view at authored scale;
2. left and right three-quarter views;
3. left and right profiles used to check volume, not as runtime sprites;
4. rear silhouette sufficient to explain hair and outfit construction;
5. neutral, happy, sad, angry, surprised, and thinking face studies;
6. eye-open, eye-closed, mouth-closed, and maximum safe mouth-open studies;
7. head yaw, pitch, and roll limit studies;
8. 1:1, 16:9, and 9:16 crop overlays.

The turnaround passes when landmarks, hair volume, ears, jaw, neck, collar, and
emblem remain consistent across views and every construction ambiguity is
annotated. The expression sheet passes when each expression is identifiable in
grayscale at 128 x 128 and does not depend on color alone.

## Safe areas and motion envelope

**Technical defaults.**

- Critical face features remain inside X `540..1508`, Y `300..1140` throughout
  required motion.
- Mouth and chin remain inside the primary safe frame at maximum open and pitch.
- Wave or other off-body gestures may leave the primary safe frame only if the
  motion declares its larger bounds.
- No required expression is clipped in any required preview aspect ratio.
- Provide a reduced-motion presentation with idle sway and secondary motion
  disabled while gaze, blink, and mouth communication remain usable.

## Phase A approval record

- Date: 2026-07-29
- Reviewer: project owner through full project-execution authorization
- Character direction: the original vector guide defined in this specification
- Canvas: 2048 x 2048 logical pixels
- Texture budget: at most two 2048 x 2048 atlases and 32 MiB decoded memory
- Bundle target: at most 5 MiB compressed for the first-party avatar
- Lip-sync scope: RMS-derived mouth openness for v1; visemes deferred
- Rights status: approved and export eligible
- Character sheet SHA-256:
  `962fc227f1235afa0c9e818f26ddbe4cfcbbc4cadfb8f270d248ae0f73b053a`
- Turnaround SHA-256:
  `64569566fb1a790c7a04828d8b4d208ff1bbf94d35423b8457136bb6c96f839e`
- Layer breakdown SHA-256:
  `22a3d0f04b3811c6bd076c2774449ba9353417d123c7f875503270d27fb1cd03`

Phase B may refine implementation details, but any change to these approved
creative files or budgets requires a new recorded review.
