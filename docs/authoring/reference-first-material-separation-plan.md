# Reference-first material-separation plan

Status: revised implementation plan  
Date: 2026-08-01  
Source reviewed: `Gothic Aristocrat Anime Character Design.pdf`

## Decision

The default workflow returns to one coherent finished character reference
before layer generation. Independent text-to-image calls cannot reliably keep
face, proportions, lighting, line style, clothing geometry, and direction
consistent. The strict parts-first experiment remains recorded as evidence but
is not the production direction.

This does not mean accepting simple rectangular crops as finished parts. The
reference supplies the exact visible pixels and identity. Material separation
isolates those visible pixels with semantic masks and refined alpha. Inpainting
creates only the concealed pixels needed behind overlapping parts. The neutral
character is then reconstructed from the completed layers and compared with
the reference.

The texture atlas shown by Gemini is a derived packing/export view. The editable
project continues to store aligned full-canvas layers; it never cuts an atlas
back into source artwork. An atlas alone is not a rigged Live2D Cubism model.

## What the PDF establishes

1. Start from a coherent finished illustration.
2. Plan movable semantic parts and their hierarchy.
3. Isolate visible pixels using semantic/instance segmentation.
4. Refine soft edges with alpha matting.
5. Inpaint art hidden behind hair, clothing, eyelids, limbs, and accessories.
6. Reconstruct and validate the character before atlas packing or rigging.

Gemini names Mask R-CNN, YOLO segmenters, ViTMatting, LaMa, ControlNet, and
IP-Adapter as examples, not as components already available in this project.
They cannot be treated as installed or approved dependencies without a model,
license, performance, and integration decision.

## Local capability audit

| Capability                        | Available locally            | Initial use                       |
| --------------------------------- | ---------------------------- | --------------------------------- |
| Text-guided segmentation          | SAM3 nodes                   | Candidate semantic masks          |
| Face-region mask                  | MediaPipe face mask          | Face validation and fallback      |
| Mask grow/feather/composite       | Built-in ComfyUI nodes       | Edge and overlap processing       |
| Coherent character generation     | Animagine XL 4.0             | Identity reference                |
| Hidden-area inpainting            | SD 1.5 inpainting checkpoint | Recovery prototype                |
| Pose conditioning                 | OpenPose SDXL ControlNet     | Stable front-facing composition   |
| Anime-specific 30-class segmenter | Not installed                | Future benchmark/approval         |
| ViTMatting or equivalent          | Not installed                | Future soft-edge upgrade          |
| LaMa                              | Not installed                | Future hidden-area benchmark      |
| IP-Adapter identity conditioning  | Not installed                | Required future consistency study |

## Revised default pipeline

### R0 — Coherent reference and private specification

Generate one controlled full-body reference from the prompt. Record prompt
plan, seed, checkpoint, pose-control version, dimensions, and hash. Reject
cropped, multiple-subject, obscured-face, background, and severe anatomy
failures before separation begins.

Create a private prompt-aware part manifest and z-order. The initial manifest
must include a complete face base, rear/front/side hair, independent eye and
mouth groups, neck, torso, clothing groups, limbs, footwear, headwear, and held
props when present.

### R1 — Semantic mask planning

Request multiple SAM3 candidates for each semantic label using precise aliases.
Resolve left/right labels with canonical anchors and pose coordinates. Intersect
candidates with bounded anatomical regions, select connected components near
their anchors, reject masks with implausible size or edge contact, and record
confidence plus the chosen prompt.

Never silently replace a missing semantic mask with a large rectangle. A
fallback region is only a diagnostic suggestion and blocks automatic approval.

### R2 — Visible-layer isolation and alpha refinement

Copy visible source pixels through the accepted semantic mask into an aligned
full-canvas RGBA layer. Refine boundaries with grow/shrink, feathering, color
decontamination, and hair-edge handling. Preserve original visible pixels; AI
must not repaint them merely to make separation easier.

Run an exact visible reconstruction test before hidden art is added. The
ordered isolated layers must reproduce the visible reference within a bounded
pixel error. This catches holes, duplicated pixels, wrong z-order, and masks
assigned to the wrong side.

### R3 — Occlusion graph and hidden-area masks

Build a front-to-back occlusion graph from the manifest and pose anchors. For
each moving boundary, distinguish:

- visible mask: pixels copied from the reference;
- concealed-required mask: pixels needed for approved motion;
- inpaint mask: concealed-required minus visible pixels;
- protection mask: every accepted visible pixel that must stay unchanged.

Examples include scalp behind bangs, face beneath hair, eye contents beneath
lids, neck beneath the chin/collar, torso beneath clothing, dress beneath coat
tails, and legs beneath skirts or boots.

### R4 — Hidden-area-only inpainting

Inpaint only the concealed mask while conditioning on the coherent reference,
visible layer, neighboring layers, character specification, pose, palette, and
seed family. Composite the untouched visible pixels back over the generated
hidden pixels after every job.

The installed SD 1.5 inpainting model is a feasibility baseline, not a quality
approval. Benchmark an identity adapter and a stronger rights-reviewed
inpainting/matting route before production acceptance. A failed hidden-art job
must remain pending instead of replacing the layer with a generic rectangle.

### R5 — Reconstruction and motion-boundary validation

Assemble the completed full-canvas layers in z-order and compare the neutral
composite with the original reference. Require:

- no visible seam, fringe, hole, duplicate outline, or background;
- preserved face, silhouette, palette, lighting, and clothing details;
- complete hidden pixels at every approved motion boundary;
- independent eye, mouth, hair, clothing, limb, footwear, and prop controls;
- unchanged visible-source hashes outside approved inpaint regions.

Only after reconstruction passes may Studio create expressions, conservative
motion, an Open Avatar bundle, or a derived review atlas.

### R6 — Optional atlas and Cubism handoff

Pack accepted layers into an atlas only as a derived artifact with stable IDs
and reversible placement metadata. For Cubism, export named PSD groups and
verify import in Cubism Editor. Do not label the atlas, PSD, or Open Avatar
bundle as a finished `.moc3` model.

## Mandatory user-review workflow

Automatic confidence never approves creative or anatomical correctness. Studio
must persist the following review state machine and keep export disabled while
any required decision is pending:

1. **Front reference:** show the full coherent reference, framing/face/body
   diagnostics, prompt interpretation, seed, and checkpoint. The user can
   accept, reject, or regenerate without overwriting an accepted revision.
2. **Manifest and orientation:** show the part hierarchy and explicitly define
   character-left as screen-right in a front view. The user confirms optional
   parts, draw order, and supported motion envelope.
3. **Visible part review:** for every part, show source, colored mask overlay,
   isolated RGBA on checkerboard, and assembled context. Show segmentation
   prompt, confidence, anchor, bounds, edge contact, ownership, and warnings.
   Provide Accept, Reject, Retry mask, brush correction, replacement upload,
   solo, visibility, opacity, and draw-order controls.
4. **Visible reconstruction:** show reference and reconstruction side by side,
   a wipe comparison, alpha-aware coverage/duplicate heatmaps, edge-weighted
   difference, and reconstruction error. No hidden-art job may start until the
   user accepts this gate.
5. **Concealed-art review:** before generation, display the proposed
   concealed-required region in cyan, the motion that requires it, uncertainty,
   anatomy/garment prior, and maximum motion range. After generation, show
   visible-only, generated-hidden-only, completed part, and neighbor overlap.
   The user may accept, retry, edit, replace, or reduce motion to avoid the fill.
6. **Final assembly and motion:** toggle reference/reconstruction, checkerboard,
   seam heatmap, and individual layers. Test reset plus min/neutral/max for gaze,
   separate blinks, brows, mouth, head, body, hair, clothing, and supported limb
   motion. Record a reviewer sign-off before export.

Every accepted edit invalidates dependent hidden fills, occlusion decisions,
and rig checks through the part dependency graph. Review decisions, candidate
IDs, provenance, metrics, and invalidations must survive restart and rollback.

## Anatomy and garment prior policy

Anatomy references are constraints, not evidence of the character's true
hidden design. The system generates only the minimum overlap band required for
the accepted motion envelope. It does not invent a complete unseen body, back
view, or intimate anatomy. Petite or young-looking characters use a neutral
clothed mannequin envelope and skeletal landmarks only.

Approved candidates for separate license and feasibility review:

| Source                                                                                                                                                                                                                       | License/use                                                           | Proposed role                                                                                                      |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| [MakeHuman core assets and exports](https://static.makehumancommunity.org/about/license.html)                                                                                                                                | Core graphical assets/exports are CC0; application code is AGPL       | Render local body envelopes, joint positions, silhouettes, and depth/order guides without copying application code |
| [GarmentCode](https://github.com/maria-korosteleva/GarmentCode) and [GarmentCodeData](https://www.research-collection.ethz.ch/items/9d16a4da-0d30-4963-8842-af20fcf82899)                                                    | Generator MIT; dataset CC BY 4.0                                      | Derive independently implemented rules for panels, hems, sleeves, skirts, coats, and garment/body clearance        |
| [BodyParts3D](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html)                                                                                                                                                    | CC BY 4.0                                                             | Anatomical ontology and 3D spatial sanity checks, with attribution                                                 |
| [MediaPipe](https://github.com/google-ai-edge/mediapipe)                                                                                                                                                                     | Code Apache 2.0; each task model still needs its own model-card check | Runtime face/body landmark validation                                                                              |
| [Gray's Anatomy plates](https://commons.wikimedia.org/wiki/Category:Gray%27s_Anatomy_plates) and [Bridgman's Constructive Anatomy](<https://commons.wikimedia.org/wiki/File:Constructive_anatomy_(IA_cu31924014504371).pdf>) | Public-domain source scans, subject to per-file/country verification  | Human-authored joint/envelope rules only; not an anime training set                                                |
| [OpenStax Anatomy and Physiology](https://openstax.org/books/anatomy-and-physiology-2e/pages/9-5-types-of-body-movements)                                                                                                    | CC BY-NC-SA 4.0                                                       | Human reference for joint axes; do not embed, train, or ship derivatives in a commercial product                   |
| [Clip Studio clothing-fold guidance](https://tips.clip-studio.com/en-us/articles/1676)                                                                                                                                       | Copyrighted tutorial                                                  | Human reference for seams, stress points, gravity, and cloth folds only                                            |

Numeric anime-proportion presets—head/body ratio, shoulder width, hip width,
limb taper, and joint ranges—must be independently authored and versioned. Do
not scan or train on modern drawing books, Pinterest, Danbooru, or random anime
art. Buying a book does not grant conditioning, training, reproduction, or
redistribution rights. Keep a machine-readable source/license/version/hash
ledger before any reference becomes a runtime or training dependency.

## Critical engineering invariants

- A semantic fallback rectangle is diagnostic only and blocks approval.
- Visible source pixels remain unchanged outside explicitly accepted alpha-edge
  processing; protected identity is checked before canvas resampling or color
  conversion where possible.
- Pixel ownership is alpha-aware: antialiased hair/lace boundaries may share
  fractional coverage, while unexplained holes and double-opaque ownership are
  errors.
- A part must pass solo checkerboard, source overlay, and assembled-context
  review; isolated appearance alone is insufficient.
- Concealed masks are tied to a declared motion range. Large yaw, back views,
  changed arm poses, or unseen sides require additional user-provided art.
- The editable project uses one explicit canonical coordinate rule. The current
  896 by 1152 reference and proposed 2048 authoring canvas cannot coexist
  without recorded scale/transform metadata and round-trip tests.
- Accepted revisions are immutable. Retry, correction, or replacement creates
  a candidate and invalidates only the recorded dependent graph.
- Long jobs support cancel, per-part checkpoint/resume, and recovery without
  losing accepted decisions.
- Store large images as bounded IndexedDB blobs/object references rather than
  base64 in one JSON/session record. Measure storage quota before a 30–40 layer
  build.
- Motion Lab caches clipped layers/ImageBitmaps instead of allocating a new
  temporary canvas for every layer on every frame. FPS and memory gates run
  before it becomes an acceptance tool.

## Remaining problem register

1. The semantic-selection helpers are unit-tested but not connected to SAM3 or
   the review UI.
2. Studio currently hides concept acceptance, project review, and Layer Lab in
   the default flow; the mandatory review state machine is not implemented.
3. SAM3 is promptable segmentation, not a trained 30-class anime material
   separator. Black-on-black garments, hands gripping props, hair under hats,
   layered ruffles, and left/right pairing remain high risk.
4. Hair, lace, veils, glasses, translucent fabric, and cast shadows need matting
   and ownership rules beyond binary masks.
5. One front view cannot determine exact concealed anatomy, rear design,
   garment construction, crossing depth, motifs, or large-turn side views.
6. Anime proportions intentionally violate realistic anatomy; priors must be
   soft constraints or they will erase the accepted style.
7. The installed SD 1.5 inpainting model may not preserve Animagine XL identity,
   palette, or line quality. IP-Adapter/stronger inpainting remains uninstalled
   and unapproved.
8. Existing automatic bounded fallbacks can still enter generated projects and
   must be changed to blocking diagnostics.
9. Motion Lab currently covers canvas-level gaze, combined blink, mouth, and
   breath only. It lacks head/body deformation, hair/clothing physics, separate
   eye/brow controls, seam views, automatic sweeps, and mesh validation.
10. A texture atlas, PSD, or Open Avatar project is not a finished Cubism model.
11. Base64 full-canvas layers can exceed current project/session limits, and
    current per-frame canvas allocation will not scale to full review.
12. Training/reference licenses can propagate attribution, share-alike, or
    noncommercial restrictions; no new dataset enters the product without a
    legal and provenance gate.

## Implementation order

1. Reconcile the reference-first policy, full-canvas semantic-layer wording,
   canonical canvas transform, and Open Avatar/Cubism labels across plans.
2. Restore the front-reference accept/reject/regenerate UI with immutable
   revisions and restart persistence.
3. Connect SAM3 candidate selection for five hard groups: face/hair, one eye,
   coat/dress, leg/boot, and hand/cane. Add character-relative side labels,
   connected components, area/aspect/edge gates, and blocking diagnostics.
4. Implement alpha-aware pixel ownership and visible reconstruction review.
   Stop the project if the five-group benchmark cannot pass.
5. Implement per-part review, correction, replacement, dependency invalidation,
   and large-project IndexedDB blob storage.
6. Add the anatomy/garment prior ledger and conservative occlusion masks tied to
   approved motion ranges.
7. Restrict inpainting to concealed regions and prove protected visible pixels
   remain unchanged.
8. Cache Motion Lab layers and add reference toggle, seam views, automated
   motion-extreme snapshots, reset verification, and reviewer sign-off.
9. Expand to the full manifest only after the five-group visible reconstruction
   and concealed-overlap gates pass.
10. Benchmark matting and identity-conditioning candidates separately before
    adding any new model, dataset, or custom-node dependency.

## Acceptance benchmark

The Gothic Aristocrat case passes only when one prompt produces a coherent
reference, all enabled semantic masks, full-canvas RGBA layers, zero unexplained
missing parts, a neutral reconstruction visually matching the reference, and
motion-boundary previews without holes. Structural counts alone do not pass the
gate. Generated artifacts remain outside the repository.
