# Prompt-to-Live2D risk-resolution roadmap

Status: approved execution roadmap  
Updated: 2026-08-02

Open Avatar remains the default automated rig, preview, and export. A
Cubism-ready layered PSD is the optional handoff to Live2D Cubism Editor.

## Default product flow

The default is a one-click-after-approval reference-first workflow backed by a
canonical avatar-part kit:

1. enter one character prompt, choose a VTuber or anime art-style preset, and
   generate coherent front-reference variants;
2. accept, reject, or regenerate the front reference;
3. after acceptance, automatically create a registered non-exported authoring
   pack from the neutral master: false-color ownership, edges, pose, landmarks,
   and local masked expression candidates;
4. deterministically choose anatomy-compatible saved assets for the five reusable
   sets: body, face, paired eyes, mouth, and hair; each set expands to
   registered internal rig layers and may be replaced or recolored separately;
5. generate every outfit against the selected neutral fitting body and send
   other catalog misses to a bounded per-set ComfyUI job, register reviewed
   results against the same anchors, then inpaint only concealed overlap and
   expression-only artwork; validate
   reconstruction, concealed overlaps, expressions, and rigging, retrying,
   substituting a compatible preset, or reducing unsupported motion when a
   blocking gate fails;
6. save the project and automatically open Motion Lab;
7. let the user test the final assembly and min/neutral/max controls, then
   download or return to exception-focused correction; and
8. upload a previously generated project to continue its immutable revisions.

The user approves the coherent front reference and performs the final Motion
Lab test. Intermediate manifest, segmentation, hidden-fill, reconstruction,
and rig checks are blocking automated validators rather than user marking
steps. Uncertain anatomy is never declared recovered truth: the pipeline
uses a compatible part-set preset, merges, bakes, keeps rigid, reduces motion,
or stops with a precise recovery option. The optional Cubism route remains an Editor handoff; automatic output
is labelled Open Avatar rather than an Editor-exported Cubism model.

## Anatomy-aware saved-part library decision

The product no longer requires every possible semantic micro-part to be found
in one generated neutral portrait. A build requires six user-visible sets:

1. body/proportion foundation;
2. face shape and skin palette;
3. a paired-eye assembly with shape and iris color;
4. a mouth assembly with closed and open states;
5. a registered hairstyle assembly; and
6. an outfit assembly fitted to the selected body.

Studio preselects compatible saved parts from the prompt, so the normal path
still continues with one click and normally requires no ComfyUI call. Selection
is pseudo-random but seeded per project and constrained by anatomy profile,
style, attachment anchors, and requested feature tags. The same prompt, catalog
revision, and seed therefore select the same parts. An eye color such as amber
recolors the approved iris channel; black hair recolors the approved hair
channel without repainting its alpha or line art.

If the library lacks a requested shape or feature, Studio sends only that set to
a bounded ComfyUI workflow. The generated candidate must be aligned, reviewed,
validated, and assigned compatibility metadata before it can be used or added
to the saved library. Set assets share canonical anchors, character-relative
left/right, canvas size, draw order, concealed-overlap requirements, palette
channels, style tags, topology version, provenance, and rights information. A
random independently generated part is not accepted merely because it is
transparent.

Each visible set expands internally into the layers needed by the approved
motion envelope. For example, the eye set owns sclera, iris/pupil, optional
catchlight, and blink artwork; the mouth set owns closed lips and a grouped
open-mouth state. Teeth and tongue are separated only when the open-mouth art
contains them and the local partition passes. Missing catchlights, sparse lower
lid lines, teeth, or tongue are valid style choices and never block the basic
avatar. Cat ears, animal ears, tails, wings, hats, props, jewelry, extra hair
locks, detailed garment panels, and additional expressions are optional sets.

Hidden-art inpainting remains a recovery tool, not the source of every part.
It runs after a set is selected and registered, inside bounded masks, for such
content as scalp beneath bangs, face beneath hair, continuous sclera beneath an
iris/lid, neck beneath clothing, garment overlap, and the reviewed open-mouth
cavity. If hidden art cannot be validated, Studio reduces that motion or uses a
compatible preset instead of inventing anatomy and claiming success.

Library entries are immutable revisions. Adding a new face, eye shape,
hairstyle, outfit, animal feature, or expression creates a reviewed catalog
revision; it cannot silently change existing projects. Future creator tools may
generate or draw one new set, define recolorable channels and anchors, run the
compatibility/motion tests, and then save it for reuse.

## Reference-first material-separation contract

The accepted source of truth is one coherent front reference, a reviewed
semantic manifest, and separate aligned full-canvas RGBA layers. Exact accepted
reference pixels may form the visible portion of a semantic layer; this is not
a rectangular crop. Concealed overlap is generated separately, marked as
generated during review, and limited to the accepted motion envelope. A
generated atlas or contact sheet is only a derived review/export preview and is
never split to create project art.

Every character requires the six minimum compatible sets. Their internal
expansion provides a clean face base beneath hair and facial features, paired
eye and mouth motion artwork, registered hair groups, neck/body foundation,
and front outfit artwork. Prompt-dependent groups such as side hair, hats,
coat tails, sleeves, cuffs, corsets, layered skirts, stockings, boots, hands,
canes, and other accessories are added to the private manifest before their
jobs run. Each artifact keeps the canonical canvas coordinates, transparent
background, stable ID, draw order, anchor, concealed overlap, and provenance.

The internal body foundation is never nude or underwear artwork. It uses an
explicitly adult, opaque, full-coverage fitted base suit and neutral lighting.
Clothing and accessories are generated afterward against frozen body anchors
and may not repaint skin, face, or hair. The accepted dressed reference remains
the visual identity and reconstruction target.

Reject an output when it contains a painted checkerboard, label text, alignment
guides in the art, a missing face base, combined eye components, duplicated
assembled clothing, unrelated coordinates, opaque background, or a flattened
character. The Studio may use an identity reference, masks, segmentation, and
inpainting internally. Accepted visible art must come from reviewed semantic
masks in canonical coordinates; rectangular crops and atlas-cell extraction
are prohibited.

## Risk-resolution matrix

| Risk                                                                     | Resolution                                                                                                                                                                                                                                                                                    | Gate                                                                                                                                                                  |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Poor SD 1.5 character quality                                            | Keep Animagine XL 4.0 as the reviewed SDXL/inpainting checkpoint and evaluate Z-Image Turbo as a separate split-model reference generator. Never treat its Qwen3 text encoder as the diffusion model.                                                                                         | The production suite reaches 20/20 complete front-facing characters inside safe margins, with no severe anatomy, unrequested scene, watermark, or GPU-memory failure. |
| RTX 3050 has only 6 GB VRAM                                              | Run one job at a time and batch size one. Use a 896 by 1152 portrait concept canvas: it gives full-body framing more vertical room while using slightly fewer pixels than 1024 by 1024. Use ComfyUI offloading and enable explicit low-VRAM mode if instability appears.                      | Ten consecutive jobs complete without out-of-memory errors, a frozen UI, or abandoned provider jobs.                                                                  |
| Natural-language prompts are inconsistent                                | Add a private prompt planner that produces reviewed identity, appearance, clothing, palette, pose, quality, and negative fields. Show the interpreted request before generation.                                                                                                              | Identical accepted input, workflow version, and seed produce identical provider requests and provenance.                                                              |
| Random saved parts do not fit together                                   | Select only within a shared anatomy/anchor profile and style family; validate eye containment, hairline, neck, body, garment, and optional-feature attachment points before assembly. Seed selection per project and record the catalog revision.                                             | The same project reconstructs deterministically and every attachment/motion sweep stays inside its compatible bounds.                                                 |
| Recoloring damages line art or shading                                   | Store explicit recolorable channels per catalog entry and apply bounded palette transforms only inside those masks. Preserve alpha, outlines, highlights, and protected pixels.                                                                                                               | Color changes alter only declared channel pixels and pass neutral/motion comparisons.                                                                                 |
| A requested part is absent from saved data                               | Generate only the missing set with the selected anatomy profile, neighboring silhouettes, style, and palette as conditioning. Require review and validation before use; save it as a new catalog revision only after provenance and rights checks.                                            | Existing selected sets remain byte-identical and the new set passes alignment, reconstruction, overlap, and motion gates.                                             |
| A tiny or neutral-hidden facial part cannot be segmented                 | Route macro regions to semantic segmentation, visible facial features to landmark/local analysis, and mouth internals to the generated open-mouth state. Substitute compatible eye or mouth set artwork when confidence fails; do not ask a text segmenter to find invisible tongue or teeth. | The six minimum sets complete; optional micro-parts may be absent, while every enabled layer has source-phase evidence and passes containment/reconstruction checks.  |
| Separately prompted parts drift in direction or style                    | Generate or adapt each part set against frozen anchors, palette, line treatment, accepted-reference context, and neighboring-set silhouettes. Reject incompatible standalone output and offer reviewed canonical shapes.                                                                      | Neutral assembly preserves one front direction, identity, scale, palette, and attachment geometry.                                                                    |
| Body, hair, and clothing colors bleed together                           | Build in registered stages: opaque adult base suit and anatomy envelope, facial identity, hair, clothing, then accessories. Freeze anchors and protected pixels between stages; garment jobs cannot repaint skin, face, or hair.                                                              | The final composite matches the accepted dressed reference while each garment/accessory remains an independent aligned layer and skin tone stays consistent.          |
| Identity changes between parts                                           | Lock one accepted concept into a character bible. Condition every part job on its concept, normalized landmarks, palette, approved tags, and seed family.                                                                                                                                     | Face shape, eyes, hairline, proportions, palette, and line treatment remain recognizable across all accepted parts.                                                   |
| Multiple characters or incorrect poses                                   | Use strict single-character/front-pose conditioning and automatically reject multiple faces, bodies, or major pose deviations before design approval.                                                                                                                                         | Only one centered character in the approved neutral pose reaches the character-bible gate.                                                                            |
| Diffusion does not reliably produce transparency                         | Segment reviewed visible pixels into full-canvas semantic RGBA layers, then inpaint only the concealed overlap required by approved motion. Never use rectangular crops or atlas cells as parts.                                                                                              | Every part is aligned full-canvas RGBA with valid alpha, no background, and the required concealed overlap.                                                           |
| Temporary guide colors contaminate final art                             | Keep false colors and boundary lines in a separately hashed, non-exported guide registered to the immutable neutral master. Never paint and erase them in accepted art.                                                                                                                       | Export contains no guide pixels; misregistered guides are discarded and rebuilt from segmentation plus correction.                                                    |
| Hair, lace, translucency, shadows, and same-color contacts are ambiguous | Route each boundary through its material-specific solver. If native alpha or ownership cannot be proved, merge/bake the detail, keep it rigid, request replacement art, or reduce motion.                                                                                                     | No uncertain flattened translucent matte or ambiguous contact is advertised as independently movable.                                                                 |
| Missing concealed artwork                                                | Inpaint only the bounded hidden regions required by selected sets: scalp, face beneath hair, continuous sclera, reviewed mouth cavity, neck, and garment overlap. Substitute a preset or reduce motion when validation fails.                                                                 | Motion-extreme overlays reveal no holes, duplicated outlines, or crop edges.                                                                                          |
| Part alignment drift                                                     | Freeze normalized face/body landmarks and canonical 2048 by 2048 coordinates. Reject artifacts outside anchor tolerances.                                                                                                                                                                     | The neutral composite matches the accepted concept at viewing resolution and every anchor is within approved tolerance.                                               |
| Hands and large turns are unreliable                                     | Keep v1 conservative: modest head X/Y, gaze, blink, brows, mouth, breathing, hair, and clothing physics. Treat hands and large turns as optional additional-art sets.                                                                                                                         | Unsupported motion is disabled with a clear limitation instead of being approximated badly.                                                                           |
| Automatic rigging tears or leaks                                         | Use conservative landmark-driven mesh templates, bounded parameter ranges, and manual correction for pivots, masks, mesh density, and deformation.                                                                                                                                            | Individual and combined parameter sweeps, reset, reduced motion, and a 60-second run pass without tears, leaks, drift, or inverted triangles.                         |
| Prompt edits damage unrelated parts                                      | Classify edits by impact. Recolor replaces textures; hairstyle regenerates hair, occlusion, meshes, and physics; silhouette changes trigger all dependent validation.                                                                                                                         | Unaffected hashes remain unchanged and rejecting a candidate leaves the active revision byte-for-byte unchanged.                                                      |
| Browser session storage is too small                                     | Store accepted working projects in bounded IndexedDB and provide deterministic project export/import. Keep immutable revisions, hashes, provenance, and rights state.                                                                                                                         | A large project survives browser restart and clean-session round-trip without losing accepted art or metadata.                                                        |
| Cubism output is mislabeled                                              | Export a named and grouped Cubism-ready PSD. Import and rig or verify it in Cubism Editor. Only Editor-exported `.moc3` and `.model3.json` are called a Cubism model.                                                                                                                         | The PSD imports correctly and a reviewer can export and run the genuine Cubism artifact.                                                                              |
| Model or output rights are uncertain                                     | Record every checkpoint, LoRA, control model, workflow, source reference, terms, version, and hash. Require human third-party-content review.                                                                                                                                                 | Unknown or incompatible rights block acceptance and export.                                                                                                           |
| Workflows or projects are hostile                                        | Use application-owned workflow templates, checkpoint allowlists, file/resource limits, archive validation, cancellation, and fixed provider endpoints.                                                                                                                                        | Hostile prompt, workflow, project, path, archive, oversized-artifact, cancellation, and cleanup tests pass.                                                           |
| Local quality remains insufficient                                       | Preserve local ComfyUI as the default. Add a cloud adapter only after privacy, credentials, retention, cost, and consent approval.                                                                                                                                                            | Cloud use is opt-in and returns the same provider-neutral validated artifacts without changing public runtime contracts.                                              |

## Delivery order

### Automatic character lock (internal; no Phase P2 screen)

1. Compare several concept candidates without mutating the accepted project.
2. Accept one design explicitly.
3. Derive the private character specification, normalized landmarks,
   orientation, bounded part inventory, and optional parts automatically.
4. Validate the derived plan and conservative motion envelope internally.
5. Save/load through IndexedDB and deterministic project files, then continue
   directly into part generation.

Gate: a clean session restores the exact accepted design, bible, landmarks,
part plan, provenance, and blocking rights state.

### Production-model benchmark

1. Record Animagine XL 4.0 source, license, exact file, and hash.
2. Prove checkpoint loading at 768 by 768, then run the approved quality suite
   at the model's native 1024 by 1024, one job at a time.
3. Measure single-character rate, crop/pose compliance, artifacts, time, and
   memory stability.
4. Record 768 as hardware-smoke evidence, not as the SDXL creative-quality
   baseline.
5. Approve the model only if the quality, rights, and hardware gates pass.

### Controlled-model recovery experiment

1. Candidate composition model: the upstream
   `xinsir/controlnet-openpose-sdxl-1.0` SafeTensors checkpoint, stated
   Apache-2.0, published SHA-256
   `b8524e557a7df60d081f5d4a0eb109967d107df217943bf88c2d99b9ebcc06c5`.
   The installed 2,502,139,104-byte file exactly matches that hash. This
   verifies the file but does not by itself approve production use.
2. Generate the reviewed full-body pose/layout map inside Studio. Do not add a
   third-party pose preprocessor or custom ComfyUI nodes for this experiment.
3. Extend the application-owned node allowlist only with the built-in image,
   ControlNet loader, and advanced apply nodes required by the reviewed
   template.
4. Improve the natural-language planner with explicit editable model tags for
   hair style/color, eyes, outfit, palette, accessories, and pose before
   generation.
5. Repeat the exact 20-request suite. Require at least 18/20 complete framings,
   no severe anatomy or unrequested background object, and materially improved
   distinctive-feature compliance.
6. After one concept is accepted, benchmark a separately rights-reviewed
   identity-reference adapter for part consistency. Do not combine this with
   the composition-model approval.

### P3 - Purpose-generated parts

Generate parts in dependency order, validate full-canvas alpha and anchors,
review variants, and prove concealed overlap in the neutral composite.

### P4 - Correction and source export

Add non-destructive art/mask correction, hierarchy validation, deterministic
project export, and Cubism-ready PSD export.

### P5 - Open Avatar auto-rig

Generate conservative meshes and mappings, preview through the existing
runtime, and require deterministic motion sweeps and visual approval.

### P6 - Prompt editing

Add dependency-aware eye-color, hairstyle, and clothing revisions with impact
preview, before/after motion comparisons, acceptance, rejection, and rollback.

### P7 - Cubism handoff

Prove PSD import, document manual and assisted rigging steps, export through the
approved Cubism Editor, and validate the resulting embedded model.

### P8 - Hardening

Complete accessibility, security, browser, performance, cancellation,
recovery, context-loss, soak, rights, documentation, and release-readiness
gates.

## Current next action

Z-Image Turbo is now an optional reviewed concept profile using its separate
diffusion model, Qwen3-4B text encoder, and VAE. A physical 768 by 1152 smoke
completed in about 40.16 seconds on the reference RTX 3050 and produced a
complete front-facing catgirl with readable face, hands, skirt, legs, and
boots. Experimental OpenPose conditioning is disabled by default because the
failed Studio candidate embedded the control graph and collapsed the face and
outfit, while the same machine's prompt-only Z-Image workflow produced the
desired anime/Vtuber direction. See
`docs/authoring/z-image-turbo-reference-smoke.md`.

This result approves only reference-generation experimentation. Visible
accepted pixels must still be preserved rather than repainted, and semantic
mask, hidden-overlap, expression, rigging, and Motion Lab gates remain open.

The strict independent-parts experiment is superseded. Its startup smoke proved
that Studio could skip the concept workflow, but the first raw part immediately
showed the fundamental problem: independent diffusion calls do not reliably
share one face, direction, silhouette, lighting, or clothing construction.
The production direction is now reference-first material separation: generate
one coherent character, isolate its visible semantic layers, inpaint only
concealed artwork, reconstruct the reference from completed layers, and then
rig or pack derived outputs. See
`docs/authoring/reference-first-material-separation-plan.md`.

Front-reference review and persistence are now implemented. Generation stops at
the visible neutral-master gate; accept/reject/regenerate decisions, rejection
notes, candidate history, provenance, and immutable acceptance survive in
IndexedDB. Accept or explicit reload/resume creates the private character lock
and starts downstream work automatically. A successful build saves the project
and opens Motion Lab. The authoring pose also keeps props beside rather than
across the central silhouette.

The prompt planner now exposes VTuber, anime-cel, and soft-anime presets with
neutral-lighting and skin-color constraints. Automatic part jobs are staged as
safe opaque adult base body, facial identity, hair, clothing, then accessories;
garment prompts cannot repaint protected skin, face, or hair. This ordering is
implemented and covered by CI, but still requires a labelled physical ComfyUI
comparison before its visual-quality gate can pass.

The first labelled staged-body physical run completed structurally in about 36
minutes 41 seconds with 28 masks, 28 generated artworks, four expressions, and
no recorded missing entries, but failed visual inspection: rectangular body
blocks, broken facial assembly, and incomplete wardrobe reached Motion Lab.
Count-only validation is therefore rejected. Studio now blocks unverified
bounded/pixel masks, segments against the immutable neutral master, separates
base prompts from wardrobe prompts, and prefers the validated IndexedDB project
over a legacy session draft. See
`docs/authoring/staged-body-wardrobe-smoke.md`.

The immediate implementation order is now the canonical/inverse canvas
transform and immutable invalidation graph; then the registered non-exported
false-color, edge, pose, and landmark guide; then the five-group semantic-mask
and visible-reconstruction benchmark. Material-specific hair/lace,
black-on-black, shadow, transparency, and hand/prop gates run before per-part
expansion. Automatic per-part validation, dependency invalidation,
conservative anatomy/garment overlap, hidden-only inpainting, identity-locked
local expressions, and final motion/storage/performance checks follow in that
order. Only the final Motion Lab test is a routine user sign-off.
The existing strict parts-first code remains experimental until the replacement
has physical evidence.

No plan can make missing information objectively true. The resolved fallback
for an underdetermined boundary is to merge or bake the material, keep connected
parts rigid, reduce motion, or require additional user-approved art. Studio must
never erase temporary guide lines from accepted pixels, infer an exact
transparent matte from one flattened composite, or label guessed hidden anatomy
as recovered source art.

Anatomy sources constrain plausibility but cannot recover the true unseen
design. Use licensed geometry/ontology sources such as CC0 MakeHuman exports,
CC BY GarmentCodeData and BodyParts3D, plus independently authored anime
proportion presets. Modern drawing books and tutorials are human references
only and may not be scanned, trained on, conditioned into a model, or bundled
without permission. Hidden fill is the minimum clothed overlap needed for an
approved motion range and is recorded in the final diagnostics.

The internal character-lock implementation is accepted; it is no longer a
user-facing phase. The Animagine XL 4.0 Opt prompt-only run framed 17/20 samples.
The verified OpenPose SDXL control improved the first controlled run to 18/20
and the final tuned run to 19/20, with 40/40 controlled jobs completing without
OOM or an abandoned queue. The final run still produced one top crop, one halo,
and one faint panel/background treatment, so the strict scene gate remains
failed and the workflow is not production-approved. P3 artifact validation and
dependency-ordered orchestration are implemented, but P3 art acceptance remains
blocked for production-quality release pending a passing subject/background
check and a separately rights-reviewed identity-reference experiment. The
former one-click draft is historical evidence only. In the revised default,
failed automated gates block hidden generation, rigging, and export and expose
an exception-focused recovery path.
See `docs/authoring/controlled-composition-benchmark.md` and
`docs/phase-status/phase-p3.md`. The local one-click draft pipeline now passes
physically: one prompt and one action produced a downloadable 24-layer project
with 24 generated-art entries, four expressions, and no missing parts. See
`docs/authoring/one-click-physical-smoke.md`.

The latest square-canvas draft nevertheless cropped both the face and shoes.
Studio now uses the versioned `open-avatar-openpose-v2` portrait guide, keeps
the skeleton inside top and bottom safe margins, and adds explicit whole-body,
complete-shoes, and no-edge-contact generation rules. Legacy v1 projects remain
loadable. A labelled physical concept run passed at 896 by 1152: the complete
head, hair, legs, and shoes were visible with clear top and bottom margins. The
366,604-byte result used seed `395123644` and has SHA-256
`2be20dbe607ce978a8fb593edb2d42de2c6a1dc1e0b1af0e25c478dae862d2b8`.
The artifact remains outside the repository. This single run validates the
reported overflow fix but does not replace the earlier fixed-seed suite.

The previous instruction to retire portrait segmentation and make independent
part jobs the default is superseded. The current implementation must expose the
reference-review and material-separation path, keep the strict part generator
as experimental evidence, and retain bounded correction tools for reviewed
recovery. A user-provided Gemini reference review confirmed why these gates are
necessary: its apparent checkerboard was fully opaque, parts were packed at
unrelated atlas coordinates, and several riggable components remained combined.
Those reference images remain outside the repository.

The first dependency-driven physical build now passes the structural gate: 25
separate transparent artworks, 25 masks, four expressions, a fully transparent
source canvas, and a parts-only Motion Lab reconstruction. The exported project
was 3,978,279 bytes with SHA-256
`336d6f56ce39c09b9711f32cf331f0ef2256a14976d7613ca6820495e845a787`.
The visual gate remains failed because the generic accessory layer oversized
the witch hat and the coarse outfit/body groups lost separately controllable
lower-body detail. See `docs/authoring/part-first-physical-smoke.md`.

The recovery implementation now addresses that failure with a prompt-aware
manifest. Long hair, headwear, held props, coats, sleeves, corsets, and layered
skirts enable their own jobs; left/right legs and footwear are required for
every full-body build. The concept prompt also rejects giant headwear and
floating props unless explicitly requested. A labelled physical reconstruction
completed in 24 minutes 3 seconds with 35 masks, 35 generated-art entries, four
expressions, no missing art, full-canvas RGBA transparency, and a transparent
source. It materially improved the coat, skirt, legs, boots, and cane
separation, but the visual gate still failed because the concept obscured the
face and made the hat too dominant. Studio now strengthens face-visibility
conditioning and recognizes color words between "long" and "hair" when
planning side-hair jobs. See
`docs/authoring/expanded-part-first-physical-smoke.md`.

The historical strict part-first implementation skipped the complete-character
concept, created a transparent 896 by 1152 canvas and manifest, generated parts
against dependency composites, and used part-specific SAM cleanup with bounded
image-difference fallback. A startup smoke verified queue mechanics, but the
art-quality gate failed: independent jobs did not preserve one coherent face,
direction, silhouette, lighting, or clothing construction, and bounded
fallbacks could hide semantic failure. The path is not the production default;
see `docs/authoring/parts-first-startup-smoke.md`.

## Saved avatar-kit implementation evidence

The first `standard-front-v1` saved catalog and Builder workspace are now
integrated. The catalog contains multiple compatible body, face, paired-eye,
mouth, and hair choices plus common animal features. Saved procedural outfits
were removed; each requested outfit is generated inside body-aligned torso and
sleeve masks while the neutral body remains visible as fitting context. Prompt
colors use declared channel recoloring; seeded selection is reproducible; malformed or
duplicate catalog metadata is rejected. The assembled project contains aligned
PNG masks, artwork, blink/wink/open-mouth states, local persistence, download,
and a gated Motion Lab handoff after outfit review.

The Chromium, Firefox, and WebKit flow passed for `cat girl with amber eyes and
long black hair wearing a hoodie`: it selected the long-hair and cat-ear sets,
applied the palette overrides, assembled the neutral fitting preview, required a
new outfit, and prevented that preview from entering Motion Lab. The starter art
is deterministic Canvas2D artwork owned by this repository; no unreviewed
external-AI output was admitted. Per-set ComfyUI
generation and assembled-context review are integrated for catalog misses, with
difference-derived alpha and rectangle/broad-change rejection. A physical
Animagine prop test still failed visual review because the model produced a
character/contact-sheet composition instead of an isolated aligned prop; the
output remains outside the repository. A fitted-outfit smoke test similarly
produced a second misregistered character and background; minimum-garment and
outside-mask-change gates now reject it. A pose/line-art-conditioned garment
workflow remains required. Immutable admission of accepted
generated assets and production-quality catalog art expansion remain open.

The 2026-08-03 face-base catalog PDF was reviewed as a taxonomy reference. Its
face, eye, mouth, body, hair, animal-feature, and clothing categories may guide
future registered sets, but its labeled contact sheets fail alpha,
registration, scale-consistency, provenance, and separated-layer admission
gates and therefore are not imported as catalog art.

See `docs/authoring/avatar-kit-catalog.md`.

## Primary references

- [Animagine XL 4.0 model card](https://huggingface.co/cagliostrolab/animagine-xl-4.0)
- [Stable Diffusion XL license](https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/blob/76d28af79639c28a79fa5c6c6468febd3490a37e/LICENSE.md)
- [ComfyUI low-VRAM guidance](https://docs.comfy.org/troubleshooting/overview)
- [ControlNet spatial conditioning](https://arxiv.org/abs/2302.05543)
- [ZIM fine-grained matting, CC BY-NC 4.0 release](https://github.com/naver-ai/ZIM)
- [BiRefNet high-resolution segmentation and matting](https://github.com/zhengpeng7/birefnet)
- [LayerDiffuse native transparent layers](https://github.com/lllyasviel/LayerDiffuse)
- [IP-Adapter image conditioning](https://github.com/tencent-ailab/IP-Adapter)
- [Live2D Cubism PSD import](https://docs.live2d.com/en/cubism-editor-manual/psd-import/)
- [Live2D Cubism model files](https://docs.live2d.com/en/cubism-sdk-manual/model-web/)
