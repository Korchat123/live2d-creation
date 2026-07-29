# Reference Avatar Layer Specification

Status: proposed for Phase A review  
Dependency: `visual-spec.md` and an approved original character sheet  
Scope: source-art organization and deformation intent; this document does not
define the public bundle schema or runtime API.

## Decision labels

- **Technical default**: required authoring convention unless Phase A review
  records a replacement.
- **Creative decision - approval required**: depends on the approved character
  design and must not be inferred by an implementer.

## Naming and file rules

**Technical defaults.**

- Use lowercase ASCII `snake_case` identifiers.
- A layer ID follows `<region>_<side>_<part>_<variant>`; omit segments that do
  not apply. Side is always from the character's perspective: `l`, `r`, or `c`.
- IDs are unique and stable after rigging starts. Display labels may change.
- Allowed ID characters are `a-z`, `0-9`, and `_`; IDs cannot encode draw order.
- Masks use the suffix `_mask`; deformable art uses `_mesh`; alternate states
  use a meaningful final token such as `_closed`.
- Source groups may aid authoring but every runtime-visible part has an explicit
  stable ID.
- Do not flatten independently moving, masking, or deforming parts together.
- Do not include hidden sketches, reference images, text layers, color profiles,
  or authoring metadata in runtime exports.

Examples: `eye_l_sclera`, `eye_l_iris`, `eye_l_lid_upper_mesh`,
`mouth_c_interior_mask`, `hair_r_side_mesh`.

## Canonical hierarchy

**Technical default.** Optional parts may be absent, but existing parts retain
this ownership hierarchy.

```text
avatar_root
|-- back
|   |-- hair_c_back
|   `-- accessory_back
|-- torso
|   |-- torso_c_base_mesh
|   |-- neck_c
|   |-- outfit_c_back
|   |-- outfit_c_front_mesh
|   |-- collar_l
|   |-- collar_r
|   `-- emblem_c
|-- head
|   |-- ear_l
|   |-- ear_r
|   |-- face_c_base_mesh
|   |-- face_c_shadow
|   |-- brow_l_mesh
|   |-- brow_r_mesh
|   |-- eye_l
|   |   |-- eye_l_sclera
|   |   |-- eye_l_iris
|   |   |-- eye_l_pupil
|   |   |-- eye_l_highlight
|   |   |-- eye_l_lid_upper_mesh
|   |   `-- eye_l_lid_lower_mesh
|   |-- eye_r
|   |   `-- [mirror of left IDs]
|   |-- nose_c
|   |-- mouth_c
|   |   |-- mouth_c_interior
|   |   |-- mouth_c_tongue
|   |   |-- mouth_c_teeth_upper
|   |   |-- mouth_c_lip_lower_mesh
|   |   `-- mouth_c_lip_upper_mesh
|   |-- hair_c_front_mesh
|   |-- hair_l_side_mesh
|   |-- hair_r_side_mesh
|   `-- accessory_front
`-- foreground
    `-- gesture_or_effect_optional
```

**Creative decisions - approval required.** Exact hair segmentation,
accessories, garment pieces, nose rendering, lip rendering, highlights, and
whether teeth or tongue are visible depend on the final character sheet.

## Pivot defaults

**Technical defaults.** Pivots use canvas coordinates in the neutral front pose
and are documented as landmarks. Final numeric coordinates are frozen only
after front art approval.

| Node                         | Pivot intent                                    |
| ---------------------------- | ----------------------------------------------- |
| `avatar_root`                | canvas origin / global placement                |
| `torso`                      | center between hips below visible crop          |
| `head`                       | upper neck joint, centered under jaw            |
| `eye_l`, `eye_r`             | center of each eyeball in neutral               |
| `brow_l_mesh`, `brow_r_mesh` | inner brow base for expression arcs             |
| `mouth_c`                    | midpoint of neutral mouth corners               |
| hair side pieces             | attachment point at scalp, never the visual tip |
| collar pieces                | neck-to-shoulder attachment                     |
| optional arm/hand            | anatomical shoulder, elbow, and wrist joints    |

Pivots must not silently compensate for incorrect artwork alignment. Symmetric
pivots must be evaluated from shared face landmarks, not visually guessed.

## Masking rules

**Technical defaults.**

- Each eye has a dedicated eye-aperture mask used by sclera, iris, pupil, and
  highlight; lids draw above those contents.
- Mouth interior, tongue, and teeth are clipped by a dedicated mouth-cavity
  mask.
- Masks are simple, closed, non-self-intersecting shapes and contain no visible
  color data.
- A mask affects only its declared descendants; cross-branch masks are
  prohibited.
- Prefer one mask level. Nested masks require a documented visual need and a
  renderer spike test.
- Hair occlusion should use draw order and separated art where possible, not a
  full-face mask.
- Mask padding accommodates maximum approved deformation without revealing
  texture seams.

## Canonical draw order

**Technical default.** Back-to-front order is:

1. rear accessories and back hair;
2. rear garment and torso;
3. neck and ears behind the face;
4. face base and face shadow;
5. sclera, iris, pupil, and eye highlight;
6. eye lids and brows;
7. nose;
8. mouth interior, tongue, teeth, and lips;
9. front and side hair;
10. front collar, jacket details, and emblem;
11. foreground gesture or explicitly approved effect.

Draw order must be deterministic. Parameter changes may select a documented
order variant but may not use arbitrary floating depth. The author must provide
overlap checks for head extremes, blink, mouth-open, and every required motion.

## Deformation intent

**Technical defaults.**

- `face_c_base_mesh`: preserves skull volume across modest yaw and pitch; mesh
  density increases near jaw, cheeks, eyes, and mouth without excessive
  vertices in flat regions.
- eyes: iris and pupil translate within the aperture for normalized gaze; they
  do not scale to fake yaw. Lids deform for blink and expression while the
  sclera remains clipped.
- brows: independent vertical, angle, and limited curvature deformation;
  deformations remain inside the forehead silhouette.
- mouth: vertical opening separates lip meshes and reveals clipped interior;
  width and corner motion are independent from open amount. Maximum opening
  preserves lip thickness and chin continuity.
- nose and face shadow: subtle pose response only; neither becomes the primary
  carrier of expression.
- hair: front mass follows the head; side pieces may use restrained secondary
  deformation. Reduced-motion mode disables secondary motion.
- torso and outfit: low-density deformation supports breathing, lean, and head
  compensation without stretching the emblem.
- rigid details: highlights, emblem, and small accessories follow their parent
  unless an approved motion explicitly requires deformation.

Deformation must be bounded and continuous. A parameter sweep must not reveal
holes, inverted triangles, mask leakage, disconnected outlines, or texture
stretching that changes the character's identity.

## Art preparation rules

**Technical defaults.**

- Paint concealed overlap beneath moving boundaries: eyelids, jaw, hair,
  collar, and mouth require enough hidden art for their full approved range.
- Keep shared seams color-consistent and avoid semi-transparent fringe pixels.
- Do not bake shadows that contradict required motion; separate moving shadows
  when needed.
- Neutral layers align exactly at authored scale with transforms reset.
- Each layer has a documented bounding box, pivot landmark, parent, mask,
  intended deformation, and rights-manifest entry.
- Left/right parts are independently authored or reviewed after mirroring;
  asymmetry must be intentional.

## Acceptance checklist

The layer specification passes Phase A review when:

- every visible part in the approved front sheet maps to one canonical layer or
  an explicitly documented flattening choice;
- a hierarchy diagram shows parent, mask, and back-to-front relationships;
- neutral composition is pixel-aligned with no missing overlaps;
- pivot landmarks and maximum motion envelopes are marked on the source sheet;
- gaze, full blink, maximum mouth-open, approved head limits, and reduced-motion
  mode can be explained using the proposed segmentation;
- turnaround landmarks agree with the front-layer construction;
- no layer or reference lacks a complete rights record;
- the human reviewer approves all creative decisions listed here and records
  any deviations before mesh or animation work begins.
