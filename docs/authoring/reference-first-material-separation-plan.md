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

#### Authoring reference pack

The accepted reference is an immutable neutral master. Studio derives a
technical pack from that master instead of asking independent prompt-only jobs
to redraw the character:

- `neutral-master`: complete centered front view, open eyes, closed mouth,
  level shoulders, arms and legs slightly separated, hands and shoes visible,
  even lighting, minimal perspective, plain background, and safe margins;
- `semantic-guide`: a non-exported false-color ownership image plus edge,
  pose, and landmark channels aligned to the neutral master;
- `expression-candidates`: masked edits for blink, wink, open mouth, smile, and
  required phonemes; pixels outside the accepted edit mask stay byte-identical;
- `concealed-candidates`: hidden-only proposals for scalp, face beneath hair,
  eye contents beneath lids, mouth interior, neck, garment/limb overlaps, and
  hand/prop intersections; and
- `reference-manifest`: hashes, transforms, masks, prompts, seeds, model and
  workflow versions, rights, approvals, and dependency edges for every item.

The prompt planner shows the authoring constraints separately from the user's
creative prompt. It may request subtle contrasting seams or piping only when
they are an accepted part of the design. It must not add colored separator
lines to final art and later erase them. Generated technical guides are
candidates, not truth: if their edges cannot be registered to the neutral
master, Studio discards them and obtains the guide from segmentation plus user
correction.

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

#### Material-specific separation policy

Binary segmentation is only the first candidate. The selected solver and
fallback depend on the visible material:

| Material/contact                             | Primary treatment                                                                                | Safe fallback                                                                                                          |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Opaque hair and fur edges                    | semantic core mask, erode/dilate trimap, alpha-matte benchmark, foreground-color decontamination | user-corrected trimap; group unresolved strands with the neighboring hair layer                                        |
| Lace, nets, and fine cutouts                 | topology-aware mask plus matte; preserve holes and fractional edge coverage                      | keep the detail attached to its receiving garment and restrict independent motion                                      |
| Veils, glasses, glow, and translucent fabric | native-alpha candidate only after a rights, VRAM, and identity benchmark                         | bake into the receiver or require user-supplied alpha art; do not infer color and opacity from one flattened composite |
| Black-on-black clothing                      | edge/line map, positive and negative points, bounded components, hierarchy and seam topology     | user-correct the non-exported false-color guide; retain accepted subtle piping rather than erasing it                  |
| Cast and contact shadows                     | classify caster and receiver; use a dedicated opacity/multiply shadow layer when separable       | bake the shadow into the receiver and prohibit relative motion across it                                               |
| Hand holding a prop                          | pose landmarks and three-way occlusion graph: rear fingers, prop, front fingers                  | keep hand and prop as one rigid group or reduce motion; never hallucinate independent fingers without review           |
| Hair under hats and clothing crossings       | local visible ownership, depth graph, and minimal motion-swept concealed band                    | merge ambiguous parts or reduce motion until the boundary no longer opens                                              |

The alpha equation for a flattened translucent pixel is underdetermined: one
RGB observation cannot uniquely recover foreground color and opacity. No
confidence score can convert that missing information into ground truth.

Research candidates are evidence, not approved dependencies:

- [ControlNet](https://arxiv.org/abs/2302.05543) supports spatial edge, pose,
  depth, and segmentation conditioning; the exact ControlNet weights and
  preprocessors must match the selected checkpoint and pass rights review.
- [SAM 2](https://arxiv.org/abs/2408.00714) supports interactive point, box, and
  mask prompting, but promptable segmentation still needs domain-specific
  plausibility gates and correction for layered anime art.
- [ZIM](https://github.com/naver-ai/ZIM) demonstrates fine-grained promptable
  matting, but its released CC BY-NC 4.0 license excludes it from a commercial
  product path.
- [BiRefNet](https://github.com/zhengpeng7/birefnet) is an MIT-code matting and
  high-resolution segmentation candidate; approve code, each weight file,
  training-data implications, quality, and VRAM separately.
- [LayerDiffuse](https://github.com/lllyasviel/LayerDiffuse) demonstrates native
  transparent-layer generation under Apache-2.0 code; model-weight terms,
  checkpoint compatibility, identity preservation, and local performance still
  require evidence.
- [IP-Adapter](https://github.com/tencent-ailab/IP-Adapter) demonstrates compact
  image conditioning and ComfyUI compatibility; code, weights, face-analysis
  dependencies, output rights, and anime identity quality need separate review.

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

## Risk-closure specification

"Closed in design" means a prevention, recovery path, measurable gate, and
honest stop condition are defined. It does not mean the behavior is implemented
or physically approved. Runtime acceptance remains blocked until the scheduled
evidence exists.

All recoverable failures use the same escalation ladder: retry the narrow
deterministic operation, try the approved material-specific solver, present the
candidate and diagnostics for correction, generate only reviewed concealed
pixels when information is actually hidden, then merge parts or reduce motion.
Studio never converts a failed gate into an automatic approval.

1. **Reference framing and authoring pose — closed in design.** The prompt
   planner adds visible head/hair/hands/shoes, front-facing neutral posture,
   separated limbs, plain background, even lighting, safe-margin, and
   single-character constraints. Pose and edge-contact diagnostics run before
   acceptance. Any crop, major occlusion, extra subject, or unrequested scene
   blocks the reference; repeated failure offers a simpler pose or manual
   reference upload.
2. **Identity drift across guides and expressions — closed in design.** The
   neutral master is immutable. Guides must register to it; expression jobs are
   local masked edits conditioned on the master, landmarks, palette, and seed
   family. Pixels outside the edit mask must be byte-identical and facial
   landmarks must remain within the approved tolerance. Otherwise discard the
   variant; never combine independent full-frame redraws.
3. **Guide-line contamination — closed in design.** False colors and boundary
   lines live only in a separate technical guide. They are not painted into and
   deleted from final art. Alignment is checked against source edges and
   landmarks. Misregistered generated guides are rejected and rebuilt from
   segmentation plus user correction.
4. **Semantic selection and left/right errors — closed in design.** Wire the
   existing selector to provider candidates, then add positive/negative points,
   connected components, anchor distance, area/aspect, edge contact, overlap,
   topology, hierarchy, and character-relative side checks. A rectangle or
   low-plausibility candidate remains pending. The reviewer corrects it, merges
   it, replaces it, or removes the unsupported part from the motion plan.
5. **Hair, fur, and lace — closed in design.** Convert the accepted semantic
   mask to a trimap and benchmark a commercially usable soft-matte method.
   Evaluate opaque-interior fidelity, fractional boundary coverage, colored
   fringe, holes, and reconstruction error. If no approved model passes, use a
   corrected trimap or attach the boundary detail to its neighbor and constrain
   motion. ZIM is research evidence only because its released license is
   noncommercial; BiRefNet code/weights and every derivative still require a
   separate license and hardware review.
6. **Translucent fabric, glass, veils, and glow — closed by scope control.** A
   single composite cannot uniquely recover foreground RGB and alpha. Benchmark
   a rights-reviewed native-alpha route such as LayerDiffuse on the actual anime
   checkpoint and RTX 3050. If identity, alpha, VRAM, or rights fail, bake the
   material into its receiver, request user-provided layered art, or prohibit
   relative motion. Never fabricate a supposedly exact matte.
7. **Black-on-black and same-color contacts — closed in design.** Combine edge
   maps, seam topology, landmarks, hierarchy, and positive/negative prompts;
   use the false-color guide only for review. If the boundary remains ambiguous,
   require correction, keep accepted visible piping, merge the touching parts,
   or reduce motion. Color contrast alone is never the ownership test.
8. **Shadows and lighting — closed in design.** Classify each shadow as baked,
   receiver-owned, or an independent opacity/multiply layer. Test it at neutral
   and motion extremes. If separating it changes the accepted appearance, bake
   it into the receiver and constrain the caster/receiver relationship.
9. **Hands, props, and crossing fingers — closed in design.** Use hand
   landmarks, prop bounds, and an explicit rear-finger/prop/front-finger
   occlusion graph. Review visible ownership and hidden overlap. If independent
   motion cannot pass, keep the hand/prop rigid, reduce motion, or require
   replacement art rather than inventing fingers automatically.
10. **Hidden anatomy and garment construction — closed by bounded uncertainty.**
    Fit neutral clothed envelopes and joint landmarks to accepted visible
    boundaries, apply independently authored anime proportion presets and
    garment clearance rules, and generate only the motion-swept overlap band.
    Show it in cyan with source and confidence. One view never authorizes a back
    design, large yaw, changed pose, nude body, motif, or unseen accessory;
    those require additional approved art or reduced motion.
11. **Realistic priors overriding anime style — closed in design.** Priors are
    range checks, never repaint targets. Visible silhouette and landmarks from
    the accepted master dominate. Out-of-range cases warn the reviewer but do
    not auto-normalize proportions; unsafe joint inversions or impossible
    overlap still block motion.
12. **Hidden-fill identity and style drift — closed in design.** Inpaint only
    the concealed mask with identity, pose, palette, neighbor, and seed-family
    conditioning, then restore protected visible pixels. Compare seams, color,
    line width, landmarks, and perceptual identity. Retry an approved stronger
    inpaint/identity adapter only after rights and VRAM review. Otherwise reduce
    motion or require replacement art.
13. **Visible reconstruction errors — closed in design.** Use alpha-aware
    ownership, an opaque-interior exactness check, coverage/duplicate heatmaps,
    edge-weighted difference, source wipe, and z-order review. Unexplained
    interior holes, double-opaque ownership, background leakage, or changed
    protected pixels are zero-tolerance blockers.
14. **Coordinate and revision corruption — closed in design.** Record a single
    reference-to-canonical affine transform and inverse, reject unrecorded
    resampling, hash every accepted artifact, and use immutable revisions.
    Round-trip landmarks, masks, and pixels through save/load. Any accepted edit
    invalidates dependent guides, hidden fills, expressions, occlusion, meshes,
    motion checks, and export sign-off.
15. **Review fatigue and false confidence — closed in design.** Present an
    exception-first contact sheet, but require explicit front-reference,
    reconstruction, concealed-art, and final-motion sign-offs. Per-part metrics
    rank work; they never approve creative or anatomical truth. Project files
    persist pending decisions and resume at the first invalid gate.
16. **Motion tears, leaks, and unsupported range — closed in design.** Generate
    motion-swept concealed masks from the declared range, cache layer surfaces,
    test each parameter and combined corners at min/neutral/max, verify reset,
    triangle orientation, seams, bounds, FPS, and memory. Reduce ranges until
    every enabled control passes; large yaw, back view, and major limb poses
    require additional art.
17. **Storage, performance, cancellation, and recovery — closed in design.**
    Store image payloads as bounded IndexedDB blobs with content hashes and
    quotas, keep lightweight metadata in project JSON, decode/cache ImageBitmap
    or equivalent surfaces, and checkpoint per part. Cancel must stop or ignore
    the provider result without mutating accepted state. A 40-layer round trip,
    restart/resume, corrupted blob, quota failure, cancellation, 60-second
    motion soak, target FPS, and peak-memory suite blocks release until it passes
    on the reference machine.
18. **Rights and hostile inputs — closed in design.** Keep allowlisted workflows
    and checkpoints, treat prompts/projects/bundles as data, enforce file,
    archive, canvas, node, URL, time, and resource limits, and record source,
    model, weights, version, hash, license, attribution, and output terms. Unknown,
    noncommercial, incompatible share-alike, or unverifiable dependencies block
    product use and export.
19. **Open Avatar versus Cubism claims — closed in design.** The automated result
    is an Open Avatar project. A named PSD/atlas is only a handoff. Only a
    project imported, rigged, verified, and exported by supported Live2D Cubism
    tooling may be called a Cubism model.
20. **No automatic solution passes — closed by graceful degradation.** Preserve
    the accepted master and completed decisions, explain the exact failing
    boundary, and offer correction, replacement upload, merged rigid layers, or
    reduced motion. Export remains blocked only for enabled unsupported
    features; the product never substitutes generic rectangles or claims a
    guessed hidden design is true.

## Implementation order

1. Freeze the reference-first contracts, canonical/inverse transform,
   character-relative orientation, immutable revision graph, and truthful Open
   Avatar/Cubism labels.
2. Restore the front-reference accept/reject/regenerate UI and persist pending
   and accepted revisions across restart.
3. Add the authoring prompt planner and front-pose/framing gate. Produce an
   immutable neutral master before any guide or expression job.
4. Create the non-exported technical guide record: false-color ownership, edge,
   pose, landmarks, registration metrics, provenance, and user corrections.
5. Connect provider candidates to the semantic selector for five hard groups:
   face/hair, one eye, coat/dress, leg/boot, and hand/cane. Add positive/negative
   prompts, side, component, area/aspect/edge, overlap, topology, and hierarchy
   gates; remove all automatic rectangle acceptance.
6. Implement alpha-aware ownership and visible reconstruction review. Stop the
   expansion if the five-group exact-interior, coverage, duplicate, fringe, and
   z-order benchmark cannot pass.
7. Benchmark material solvers independently: opaque hair/lace matting,
   same-color contacts, shadows, and native transparency. Record license, VRAM,
   latency, identity, alpha, and reconstruction evidence; use the specified
   merge/bake/motion-reduction fallback when a solver fails.
8. Implement per-part correction/replacement, dependency invalidation,
   checkpoint/resume, and content-addressed IndexedDB blob storage.
9. Add the anatomy/garment prior ledger, clothed-envelope fit, occlusion graph,
   and motion-swept concealed masks. Require the cyan pre-generation review.
10. Restrict inpainting to accepted concealed masks, restore protected visible
    pixels, and gate seam, palette, line, identity, and overlap quality.
11. Generate identity-locked expression candidates only as local masked edits;
    prove all pixels outside the expression mask remain unchanged.
12. Cache Motion Lab layers and add reference/reconstruction toggles, seam and
    ownership views, automated individual/combined parameter sweeps, reset,
    FPS/memory soak, and reviewer sign-off.
13. Run rights, hostile-input, corrupt-storage, quota, cancellation, restart,
    rollback, and deterministic export suites.
14. Expand from five hard groups to the complete manifest only after every
    preceding gate has physical evidence on the reference hardware.

## Acceptance benchmark

The labelled suite includes a simple opaque baseline plus the Gothic
Aristocrat case, black-on-black coat/dress, long hair under a hat, layered
ruffles and lace, veil or glasses, hand/cane crossing, cast shadow, and a petite
clothed silhouette. Rights-approved fixtures contain reviewer-authored masks,
ownership, z-order, landmarks, and expected fallback decisions; generated
artifacts remain outside the repository.

Production acceptance requires:

- 20/20 reference jobs contain exactly one complete front-facing character,
  with head, hair, both hands where required, legs, and shoes inside the safe
  margins and no unrequested scene or severe anatomy failure;
- every technical guide is registered to its neutral master and every required
  semantic role has an explicit accepted, merged, baked, replaced, or disabled
  decision—never a rectangle fallback;
- protected visible pixels and expression pixels outside accepted edit masks
  have zero byte differences;
- opaque interiors reconstruct exactly, with zero unexplained holes,
  double-opaque ownership, background leakage, or incorrect character side;
- boundary-IoU/F-score, fringe, and alpha reconstruction thresholds are frozen
  against the reviewer-authored fixtures before the benchmark and cannot be
  relaxed after seeing a failing result;
- every enabled motion-swept concealed region is covered at individual and
  combined parameter extremes, with zero visible holes, inverted triangles,
  or unapproved seams;
- a 40-layer project survives cancellation, restart/resume, immutable retry,
  quota/corrupt-blob handling, export/import, and clean-session round-trip with
  accepted content hashes unchanged;
- Motion Lab maintains at least 30 FPS during the 60-second reference-hardware
  soak without monotonic memory growth, then reset returns every parameter and
  layer transform to its recorded neutral state; and
- reference, visible reconstruction, concealed candidates, final motion,
  provenance, and rights all have persisted human sign-off.

The pipeline passes only the features it can prove. A character may pass with
translucent fabric baked into its receiver or a hand/prop kept rigid, provided
the limitation is explicit and no disabled motion is advertised. Structural
counts or a visually plausible neutral thumbnail alone never pass the gate.
