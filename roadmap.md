# Prompt-to-Live2D risk-resolution roadmap

Status: approved execution roadmap  
Updated: 2026-08-01

Open Avatar remains the default automated rig, preview, and export. A
Cubism-ready layered PSD is the optional handoff to Live2D Cubism Editor.

## Risk-resolution matrix

| Risk                                             | Resolution                                                                                                                                                                                                                                   | Gate                                                                                                                                                                                                                       |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Poor SD 1.5 character quality                    | Benchmark Animagine XL 4.0 through a reviewed ComfyUI template. Translate natural-language descriptions into the model's required tag structure. Keep SD 1.5 only as technical fallback evidence.                                            | At least 80% of the test set has exactly one character, 90% preserves the entire head, hair, neck, and shoulders, no accepted image contains a watermark or unrelated object, and no run fails from GPU memory exhaustion. |
| RTX 3050 has only 6 GB VRAM                      | Run one job at a time and batch size one; use 768 by 768 only to prove the checkpoint loads, then measure the model's native 1024 by 1024 quality workflow. Use ComfyUI offloading and enable explicit low-VRAM mode if instability appears. | Ten consecutive jobs complete without out-of-memory errors, a frozen UI, or abandoned provider jobs.                                                                                                                       |
| Natural-language prompts are inconsistent        | Add a private prompt planner that produces reviewed identity, appearance, clothing, palette, pose, quality, and negative fields. Show the interpreted request before generation.                                                             | Identical accepted input, workflow version, and seed produce identical provider requests and provenance.                                                                                                                   |
| Identity changes between parts                   | Lock one accepted concept into a character bible. Condition every part job on its concept, normalized landmarks, palette, approved tags, and seed family.                                                                                    | Face shape, eyes, hairline, proportions, palette, and line treatment remain recognizable across all accepted parts.                                                                                                        |
| Multiple characters or incorrect poses           | Use strict single-character/front-pose conditioning and automatically reject multiple faces, bodies, or major pose deviations before design approval.                                                                                        | Only one centered character in the approved neutral pose reaches the character-bible gate.                                                                                                                                 |
| Diffusion does not reliably produce transparency | Generate a contextual part, segment it, reconstruct concealed pixels by inpainting, and place it on the canonical full-canvas transparent layer. Accepted parts are generated artwork, not source crops.                                     | Every part is aligned full-canvas RGBA with valid alpha, no background, and the required concealed overlap.                                                                                                                |
| Missing concealed artwork                        | Explicitly generate scalp, full face beneath hair, eye contents beneath lids, mouth cavity, neck beneath the head, and torso beneath clothing.                                                                                               | Motion-extreme overlays reveal no holes, duplicated outlines, or crop edges.                                                                                                                                               |
| Part alignment drift                             | Freeze normalized face/body landmarks and canonical 2048 by 2048 coordinates. Reject artifacts outside anchor tolerances.                                                                                                                    | The neutral composite matches the accepted concept at viewing resolution and every anchor is within approved tolerance.                                                                                                    |
| Hands and large turns are unreliable             | Keep v1 conservative: modest head X/Y, gaze, blink, brows, mouth, breathing, hair, and clothing physics. Treat hands and large turns as optional additional-art sets.                                                                        | Unsupported motion is disabled with a clear limitation instead of being approximated badly.                                                                                                                                |
| Automatic rigging tears or leaks                 | Use conservative landmark-driven mesh templates, bounded parameter ranges, and manual correction for pivots, masks, mesh density, and deformation.                                                                                           | Individual and combined parameter sweeps, reset, reduced motion, and a 60-second run pass without tears, leaks, drift, or inverted triangles.                                                                              |
| Prompt edits damage unrelated parts              | Classify edits by impact. Recolor replaces textures; hairstyle regenerates hair, occlusion, meshes, and physics; silhouette changes trigger all dependent validation.                                                                        | Unaffected hashes remain unchanged and rejecting a candidate leaves the active revision byte-for-byte unchanged.                                                                                                           |
| Browser session storage is too small             | Store accepted working projects in bounded IndexedDB and provide deterministic project export/import. Keep immutable revisions, hashes, provenance, and rights state.                                                                        | A large project survives browser restart and clean-session round-trip without losing accepted art or metadata.                                                                                                             |
| Cubism output is mislabeled                      | Export a named and grouped Cubism-ready PSD. Import and rig or verify it in Cubism Editor. Only Editor-exported `.moc3` and `.model3.json` are called a Cubism model.                                                                        | The PSD imports correctly and a reviewer can export and run the genuine Cubism artifact.                                                                                                                                   |
| Model or output rights are uncertain             | Record every checkpoint, LoRA, control model, workflow, source reference, terms, version, and hash. Require human third-party-content review.                                                                                                | Unknown or incompatible rights block acceptance and export.                                                                                                                                                                |
| Workflows or projects are hostile                | Use application-owned workflow templates, checkpoint allowlists, file/resource limits, archive validation, cancellation, and fixed provider endpoints.                                                                                       | Hostile prompt, workflow, project, path, archive, oversized-artifact, cancellation, and cleanup tests pass.                                                                                                                |
| Local quality remains insufficient               | Preserve local ComfyUI as the default. Add a cloud adapter only after privacy, credentials, retention, cost, and consent approval.                                                                                                           | Cloud use is opt-in and returns the same provider-neutral validated artifacts without changing public runtime contracts.                                                                                                   |

## Delivery order

### P2 - Character lock and private project

1. Compare several concept candidates without mutating the accepted project.
2. Accept one design explicitly.
3. Review editable character-bible fields and normalized landmarks.
4. Review the bounded part inventory and optional parts.
5. Save/load through IndexedDB and deterministic project files.

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
   It remains unapproved until its exact file and local hash are verified.
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

P2 is accepted. The Animagine XL 4.0 Opt checkpoint is hash-verified and passed
the 20-job hardware and single-subject gates, but prompt-only generation failed
the framing gate at 17/20 and showed identity drift. It is not approved for
production. The next action is a bounded, reviewed SDXL composition-control and
identity-reference experiment; P3 remains blocked until that controlled
workflow passes the same suite.

## Primary references

- [Animagine XL 4.0 model card](https://huggingface.co/cagliostrolab/animagine-xl-4.0)
- [Stable Diffusion XL license](https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/blob/76d28af79639c28a79fa5c6c6468febd3490a37e/LICENSE.md)
- [ComfyUI low-VRAM guidance](https://docs.comfy.org/troubleshooting/overview)
- [Live2D Cubism PSD import](https://docs.live2d.com/en/cubism-editor-manual/psd-import/)
- [Live2D Cubism model files](https://docs.live2d.com/en/cubism-sdk-manual/model-web/)
