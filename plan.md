# Portrait-to-VTuber authoring plan

## Goal

Build a local-first two-page application that helps a user turn one portrait
into an editable, layered 2D avatar and then test its motion. The preserved
`portrait.png` files are examples only; the product must work from a user's own
local upload.

We will not promise a full head turn, hand motion, or unseen artwork from a
single flat portrait. The UI will identify when additional artwork is required.

## Model-quality bar

The source must be rights-cleared, front-facing where possible, and preserved
unchanged. Automatic separation is only an editable suggestion: masks, cleanup,
and generated layer data must be separate from the original upload.

A convincing avatar needs generous overlap behind every moving edge. Separate
face/base, hair groups, eye whites, left/right irises or pupils, highlights,
upper and lower eyelids/lashes, brows, mouth interior/lips/teeth/tongue, torso,
and any movable hands. A single flattened portrait cannot supply occluded
pixels. Unsupported large turns, hands, and extreme mouth shapes therefore need
additional artwork.

The eye order, from back to front, is face and eye white; iris/pupil and
highlight clipped to the eye opening; eyelids/lashes; then foreground hair. The
pupil must be an independent moving asset, never a copied patch of face. At
neutral, the composite must visually match the approved source portrait.

Initial parameters are gaze X/Y, left/right blink, mouth open/form, a small
head range where art permits it, and subtle breathing. Every movable feature
needs appropriate mesh/deformer detail around visible bends rather than
excessive uniform density. Physics is secondary motion only; it cannot repair
incorrect artwork or layer order. These principles align with the official
[ArtMesh](https://docs.live2d.com/en/cubism-editor-manual/concept-of-artmesh/)
and [deformer](https://docs.live2d.com/en/cubism-editor-manual/deformer/)
guidance.

A model is acceptable only when neutral matches the reference; pupils remain
inside their own openings at gaze extremes; lids close without leaks; mouth
states have no holes; breathing loops for 60 seconds without drift; combined
controls remain stable; and reset returns to neutral.

## Scope decisions

- The app is local-first: upload and editing stay in the browser unless a later
  approved phase introduces a service.
- The runtime and project format remain private to this repository. Cubism
  export/import is out of scope until licensing, compatibility, and release
  policy are explicitly approved.
- Automatic segmentation is an editable suggestion, never an irreversible
  replacement for the source image or a user-edited mask.
- Initial motion support is gaze, blink, mouth, and subtle breathing. Head
  turns and hands require validated extra layers.

## Delivery phases and gates

### Phase 0 — Foundations and quality reference

Create the portrait-only baseline, document the art/rigging requirements, and
define the neutral reference image used for visual comparisons.

Gate: the requirements document is reviewed; the source portrait is preserved
unchanged; obsolete generated derivative assets are absent.

### Phase 1 — Builder shell and local project model

Implement page 1: local image selection, clear import errors, a non-destructive
project state, an active-layer list, source/composite/checkerboard previews,
and accessible keyboard focus.

Gate: a user can select a local image, create/rename/select a layer, and return
to the original preview without changing the original file. The motion page is
disabled until a valid project exists.

Usability evaluator checks: understandable first action, labels/instructions,
keyboard operation, small-screen layout, and 200% zoom readability.

### Phase 2 — Assisted separation and brush correction

Add opt-in automatic layer suggestions for face, eyes, mouth, and optional
hands. Add add/erase brush modes, adjustable size, pan/zoom, undo/redo, layer
visibility/lock/reorder, and per-layer mask editing. Suggestions never overwrite
a manually edited mask.

Gate: a user can correct a wrong suggestion, see the result immediately, undo
and redo it, and inspect each mask over the source. The application clearly
warns about parts that cannot be recovered from a flat image.

Usability evaluator checks: discoverability of brush modes and active layer,
error prevention, visible selection state, and recovery after mistakes.

### Phase 3 — Validation and project handoff

Add neutral-composite comparison (including side-by-side/overlay), layer-order
validation, eye-opening clipping setup, required-layer checks, local save/load,
and a handoff format for the motion lab.

Gate: neutral composition is visually compared against the source; the app
rejects missing or wrongly ordered eye layers and explains the fix. A saved
project round-trips without losing masks or order.

Motion evaluator checks: neutral similarity, correct eye order, pupil clipping,
and explicit warnings for unsupported parts.

### Phase 4 — Motion Lab

Implement page 2 using the validated project: gaze X/Y, independent/blended
blink, mouth open/form, reset, and a reduced-motion-aware breathing toggle.
Show the source/composite comparison and a clear "needs additional artwork"
state for unsupported head or hand controls.

Gate: controls are unavailable until Phase 3 validation passes. Reset restores
neutral exactly, and every control has an accessible label and numeric state.

Motion evaluator checks: all gaze extremes, individual/both blinks, mouth
states, 60-second breathing stability, combined controls, reset, and
reduced-motion behavior.

### Phase 5 — Refinement, automated checks, and acceptance

Correct findings from the two evaluators. Add automated behavior, accessibility,
and visual-regression coverage for each finished capability. Test the preserved
portrait examples and a second locally selected image.

Final gate:

- no visual regression from the approved neutral portrait;
- all Phase 4 motion acceptance checks pass;
- the Builder is usable with keyboard, touch/trackpad, and narrow viewports;
- documentation, tests, linting, type checks, build, and repository safety
  checks pass through `pnpm run ci`.

### Phase 6 — Final local export

Add a clearly labelled final **Export project** action once the validation and
motion gates have passed. Export a versioned, private project bundle containing
the source-image reference, layer metadata/order, masks or layer assets,
validated parameter defaults, and a manifest with the project's limitations.
Do not export secrets, recordings, temporary previews, generated build output,
or a public Cubism package.

Gate: exported data can be imported into a fresh browser session, preserves
neutral composition and layer order, restores the supported controls, and is
rejected with a useful message when required data is missing or corrupt.

## Evaluation cadence

No phase advances on implementation confidence alone. After each gate, record:

1. what was tested and with which portrait;
2. evaluator findings and screenshots where useful;
3. fixes or accepted limitations;
4. automated tests added for the accepted behavior;
5. approval to start the next phase.

The usability evaluator reviews Phases 1, 2, and 5. The motion evaluator
reviews Phases 3, 4, and 5. Their findings take priority over adding more motion
controls.

## Current position

Phase 0 is complete. The current work item is the Phase 1 Builder shell; no new
avatar deformation feature should be added before its gate passes.
