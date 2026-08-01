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

## Implementation order

1. Restore coherent reference generation as the default route.
2. Add a private semantic-mask record with label, side, anchors, confidence,
   visible mask, and diagnostics; do not change public packages yet.
3. Implement SAM3 candidate selection, left/right disambiguation, connected
   component filtering, and mask-size gates.
4. Add visible-layer extraction and neutral visible reconstruction comparison.
5. Add occlusion and protection masks for face/hair, eyes/lids, mouth, neck,
   torso/clothing, legs/footwear, and requested accessories.
6. Restrict inpainting to concealed regions and prove visible pixels remain
   unchanged.
7. Run the Gothic Aristocrat prompt as the labelled physical acceptance case.
8. Benchmark matting and identity-conditioning candidates separately before
   adding any new model or custom-node dependency.

## Acceptance benchmark

The Gothic Aristocrat case passes only when one prompt produces a coherent
reference, all enabled semantic masks, full-canvas RGBA layers, zero unexplained
missing parts, a neutral reconstruction visually matching the reference, and
motion-boundary previews without holes. Structural counts alone do not pass the
gate. Generated artifacts remain outside the repository.
