# Prompt-to-Live2D Studio - Product and Delivery Plan

Status: draft product pivot; implementation gates require approval

Working name: Prompt-to-Live2D Studio

Repository name: `live2d-model`

Approved output decision: support both formats. Open Avatar is the default
automated rig, preview, and export path. Live2D Cubism is an optional layered
PSD handoff completed and exported through Cubism Editor.

## 1. Product goal

Build a local-first Studio in which a user can:

1. describe a new 2D character in a text box;
2. generate a consistent character design and every required movable part;
3. review and correct the generated parts without cropping a flattened portrait;
4. assemble and auto-rig an editable 2D avatar;
5. preview gaze, blink, mouth, head, body, and secondary motion;
6. upload a project and request changes such as a new hairstyle, eye color, or
   outfit without destroying the accepted version; and
7. export an Open Avatar bundle and a Cubism-ready layered PSD.

The quality target is a riggable character assembled from purpose-generated,
transparent, overlap-complete parts. A flattened portrait may be used as an
optional identity or style reference, but it is not the source from which the
product crops all parts.

The existing Open Avatar runtime, control protocol, renderer, validator, and
Studio work remain useful. They become the preview, automated rig, validation,
and provider-neutral runtime path behind the new prompt-first authoring flow.

## 2. What “real Live2D model” means

The product must use precise output labels:

- **Generated project:** the editable source of truth owned by this repository.
- **Open Avatar bundle:** the generated art and rig running in the repository's
  existing browser runtime. It is not a Live2D Cubism model.
- **Cubism-ready PSD:** aligned, named, layered art prepared for import into
  Live2D Cubism Editor. It is not yet a rigged Cubism model.
- **Live2D Cubism model:** editable `.cmo3` data or runtime `.moc3` and
  `.model3.json` data created and exported by Live2D Cubism Editor.

Live2D's official documentation says a PSD import creates ArtMeshes, while the
parameter-linked vertex movement is recorded in the `.moc3` exported by
Modeler. Therefore ComfyUI image generation alone cannot truthfully produce a
finished Cubism model.

The default Generate and Export flow delivers an automated Open Avatar rig.
Users may additionally export a Cubism-ready PSD. An actual `.moc3` is an
assisted Cubism Editor handoff until a documented, licensed, reliable
automation route is approved. The application must never rename a layered
image or Open Avatar bundle as a Cubism model.

## 3. Primary user workflows

### Create a model from a prompt

1. Enter character, outfit, palette, and motion requirements, then choose a
   bounded VTuber or anime art-style preset.
2. Choose local ComfyUI or another approved generation provider.
3. Generate several neutral full-character concepts.
4. Accept one concept. Studio derives the private identity lock, landmarks,
   orientation, and prompt-aware part inventory automatically.
5. Generate a safe opaque adult base-body foundation, then face, hair,
   clothing, and accessories on the same full canvas with transparency,
   concealed overlap, stable landmarks, and reference conditioning.
6. Run blocking reconstruction, concealed-art, and motion validators; retry or
   reduce unsupported motion automatically when a gate fails.
7. Save the editable project and open Motion Lab for the user's final test.
8. Export the default Open Avatar bundle, with a
   Cubism-ready PSD available as an optional additional export.

### Change an uploaded model with a prompt

1. Upload a generated project, not merely a screenshot or runtime texture.
2. Enter a request such as “long wavy hair,” “green eyes,” or “black jacket.”
3. Preview the interpreted change scope before generation.
4. Generate variants in a new revision while preserving accepted identity,
   pose, canvas, landmarks, and unaffected parts.
5. Compare old and new neutral composites and motion extremes.
6. Accept, reject, or refine the revision.
7. Re-rig only the affected dependency set when possible.

Uploads containing only a flattened image may start a new reference-conditioned
project, but cannot promise preservation of the original rig. Cubism runtime
files are not treated as editable source art. Cubism project import remains a
separate feasibility and licensing decision.

## 4. Product principles

1. **Generate for separation.** Ask the model for purpose-built layers rather
   than using crops as the primary art source.
2. **Lock identity before parts.** Accepted face, proportions, palette, line
   treatment, canvas, and landmarks form a character bible used by every job.
3. **Full-canvas alignment.** Every part is returned in the canonical canvas
   coordinate system, even when most pixels are transparent.
4. **Concealed overlap is required.** Hair, eyelids, jaw, neck, clothing, and
   mouth parts include pixels hidden in the neutral pose.
5. **Non-destructive revisions.** Prompts create candidate revisions; only
   explicit acceptance changes the active project.
6. **Dependency-aware editing.** A recolor may replace a texture. A silhouette
   change may require new masks, meshes, physics, and motion validation.
7. **Provider-neutral orchestration.** Studio uses an internal generation port;
   ComfyUI is the first adapter, not a public product contract.
8. **Reproducible evidence.** Record seed, workflow version, model/checkpoint
   identifier, adapter version, prompts, inputs, and artifact hashes.
9. **Safe data boundary.** Prompts, workflows, uploads, and outputs are hostile
   data and are bounded and validated before use.
10. **Human approval at product gates.** The user approves the coherent
    reference and performs the final Motion Lab test. Intermediate technical
    gates run automatically; rights and release approval remain explicit.
11. **Preserve dependency direction.** Applications consume packages; packages
    never import from applications.
12. **Keep packages private.** No package or model is published until license
    and release policy approval.

## 5. System architecture

```text
Studio prompt / optional reference / uploaded generated project
                              |
                     authoring orchestrator
                              |
            approved generation-provider contract
                     /                    \
          local ComfyUI adapter       future adapter
                     \                    /
              bounded artifact intake + provenance
                              |
        project revisions + character bible + part graph
                              |
        part validator -> compositor -> rig generator
                              |
             motion sweeps + visual approval
                    /                     \
        Open Avatar exporter          layered PSD exporter
                    |                     |
          existing browser runtime    Cubism Editor handoff
                                            |
                                    .cmo3 / .moc3 export
```

### Reuse from the current repository

- `packages/schema`, `validator`, and `exporter`: extend only after the new
  private project and generation contracts are approved.
- `packages/core`, `runtime`, `renderer-pixi`, `controls`, and `audio`: retain
  as the automated rig preview and Open Avatar runtime.
- `apps/studio`: evolve into the prompt workspace, revision review, part
  inspector, and Motion Lab.
- existing rights, security, performance, browser, and release checks: retain
  and extend.

### New internal boundaries

The exact public types are deliberately deferred.

- **Authoring project:** immutable source reference, character bible, part
  graph, accepted revision, candidate revisions, masks, meshes, rig metadata,
  limitations, provenance, and rights records.
- **Generation request:** intent plus approved references and bounded settings.
- **Generation result:** one or more typed artifacts and diagnostics, never an
  arbitrary command or executable workflow.
- **Provider adapter:** health/capability discovery, job submission, progress,
  cancellation, and artifact retrieval.
- **Change planner:** maps a user request to affected parts and downstream rig
  dependencies, with user confirmation before an expensive or destructive
  regeneration.

No new public package contract is frozen before its scheduled phase gate.

## 6. Generation strategy

### Character bible

The accepted concept freezes:

- canonical front pose, canvas, crop policy, and scale;
- face landmarks and body anchors;
- silhouette, proportions, age presentation, and identity features;
- palette swatches and material descriptions;
- line weight, shading, rendering style, and transparency rules;
- outfit and accessory inventory;
- approved negative constraints; and
- required expressions, pose range, and part inventory.

All later generation is conditioned on this record. A change that intentionally
alters an identity-locked field must say so and trigger broader review.

### Required avatar sets and internal generated parts

The user-visible v1 minimum is six compatible sets: body/proportion, face,
paired eyes, mouth, hair, and outfit. Studio deterministically selects saved
defaults for the first five sets using the project seed, anatomy/anchor profile,
style, and prompt tags, then generates the outfit against the selected neutral
fitting body and requires assembled review before Motion Lab;
the user may choose another reviewed shape or recolor a declared palette
channel. ComfyUI is called only when the saved library has no compatible
requested set. These are canonical registered assemblies, not independent
unconditioned images.

The sets may expand internally into:

- back, side, and front hair groups with scalp overlap;
- ears, neck, face base, and optional separated face shading;
- independent left/right sclera, iris/pupil, highlight, upper lid/lashes, lower
  lid, and brows;
- nose when the approved style needs it separated;
- closed lips and a grouped open-mouth state, with cavity, tongue, and teeth
  separated only as applicable and only after expression-local validation;
- torso, rear/front garment pieces, collar pieces, and accessories;
- optional upper arm, forearm, and hand groups only when requested; and
- alternate art required for approved expressions that deformation alone
  cannot represent.

Each result uses the same full canvas, transparent background, stable layer ID,
declared draw order, anchors, and adequate hidden overlap. Generation can use a
full-frame reference and mask internally, but the accepted layer is not a crop
cut from the original flattened portrait.

Optional sets include animal ears, tails, wings, headwear, held props,
jewelry, extra hair locks, detailed garment panels, hands with independent
motion, and additional expressions. Their absence cannot block the basic
Open Avatar build. Likewise, an art style with no catchlight, no visible lower
lid line, or no visible teeth/tongue is valid. Basic completion is judged at the
set/capability level rather than by forcing nonexistent pixels into every
possible semantic slot.

Every saved set records its immutable catalog revision, anatomy/anchor profile,
compatible profiles, topology version, style and feature tags, recolorable
channel masks, internal layer roles, draw order, safe motion envelope,
provenance, and rights state. A generated catalog miss is conditioned on the
selected neighboring sets and cannot enter the library until alignment,
reconstruction, overlap, motion, provenance, and rights checks pass.

### ComfyUI adapter

The first spike uses ComfyUI's documented workflow-graph and asynchronous job
model. The repository owns versioned, reviewed workflow templates. User text is
inserted only into bounded template fields.

Initial policy:

- connect to an explicitly configured local endpoint;
- discover health and required capabilities before enabling Generate;
- use allowlisted workflow templates and node classes;
- never execute a workflow graph supplied by an uploaded project;
- never allow prompts to select output paths, nodes, checkpoints, URLs, or
  commands directly;
- apply time, queue, pixel, file-count, and byte limits;
- validate decoded MIME type, dimensions, alpha, and hashes;
- keep credentials out of browser bundles and exported projects; and
- store checkpoint/workflow identifiers for reproducibility without bundling
  checkpoint files.

Specific checkpoint and custom-node dependencies are selected only in the
generation spike and must have recorded licenses and version pins.

## 7. Prompt-edit impact rules

| Requested change             | Expected scope                                       | Required follow-up                                              |
| ---------------------------- | ---------------------------------------------------- | --------------------------------------------------------------- |
| Eye color                    | Iris/pupil textures                                  | Composite, gaze, and identity checks                            |
| Hair color                   | Existing hair textures                               | Composite, alpha-edge, and motion sweeps                        |
| Hairstyle                    | Hair parts and possibly occlusion masks              | Mesh, physics, draw-order, head-pose, and overlap checks        |
| Clothing color/material      | Affected garment textures                            | Composite and motion sweeps                                     |
| Clothing silhouette          | Garment parts, masks, and possibly arms/hair overlap | Mesh, draw-order, pose, and clipping checks                     |
| Facial feature or age change | Face and dependent facial parts                      | Treat as identity revision and rerun full facial rig validation |
| Body pose/proportion         | Broad part graph                                     | Treat as a new model version and rerig                          |

The change planner must show this impact before running the job. Users can
override the plan only within safe, validated bounds.

## 8. Quality and acceptance

### Art acceptance

- Neutral composite matches the accepted concept at the intended viewing size.
- Part boundaries have no light fringe, holes, duplicated lines, or background.
- Hidden overlap covers every approved deformation extreme.
- Paired parts preserve intentional symmetry or documented asymmetry.
- All parts retain identity, palette, line style, lighting, and canvas alignment.
- No watermark, signature, prompt text, or unexplained foreign object exists.
- The project records generation provenance and the user's rights declaration.

### Rig acceptance

- Pupils remain clipped inside their own eye openings at all gaze extremes.
- Individual and combined blinks close without leaks.
- Mouth open/form states reveal only valid interior art and return to neutral.
- Approved head X/Y and body motion do not expose missing pixels.
- Hair and clothing physics remain bounded and disable in reduced-motion mode.
- Combined parameter sweeps do not tear, invert meshes, drift, or change draw
  order unexpectedly.
- Reset reproduces the accepted neutral composite.

### Revision acceptance

- Unaffected part hashes remain unchanged unless the impact plan approved them.
- Identity similarity does not regress for a non-identity edit.
- The before/after diff is shown at neutral and affected motion extremes.
- Rejecting a candidate leaves the active revision byte-for-byte unchanged.
- Project save/load preserves revision history and generation metadata.

## 9. Security, privacy, and rights

- Local-first remains the default. A cloud provider requires a separate consent,
  privacy, credential-storage, retention, and cost design.
- Uploaded archives, project manifests, prompts, workflow metadata, image files,
  and provider responses are untrusted.
- Reject traversal, absolute paths, external asset URLs, decompression bombs,
  excessive dimensions, excessive part counts, unexpected file types,
  malformed images, non-finite numbers, and unknown major versions.
- Never execute commands, scripts, serialized nodes, or embedded metadata from
  a project or generated image.
- Strip unnecessary image metadata from exports while retaining project-level
  provenance.
- The user must confirm rights to uploaded references. The project must record
  checkpoint/model and generated-output license evidence before export.
- Generated output is never automatically declared original, exclusive,
  trademark-safe, or redistributable.
- Do not commit prompts containing personal data, uploaded art, generated
  output, checkpoints, recordings, credentials, or release archives.

## 10. Delivery phases and gates

### Phase P0 - Pivot approval and feasibility

- [x] Support both output paths, with Open Avatar as the default and Cubism as
      an optional Editor handoff.
- [ ] Approve local ComfyUI as the first provider and name the reference GPU,
      operating system, VRAM, storage, and acceptable generation time.
- [ ] Approve the rights policy for references, checkpoints, LoRAs, generated
      output, and commercial use.
- [ ] Record the Cubism Editor/license boundary and supported handoff.
- [ ] Audit the current uncommitted Studio generation work against this plan;
      preserve it until ownership and intent are confirmed.
- [ ] Update the runtime/format ADR instead of silently contradicting it.

Gate: the output labels, provider boundary, hardware budget, rights policy, and
current-work disposition are approved. No speculative public contract is added.

### Phase P1 - Safe generation-provider spike

- [x] Add a prompt workspace with endpoint setup, health state, model/template
      selection from an allowlist, Generate, progress, cancel, and errors.
- [x] Prove one reviewed ComfyUI workflow end to end through a private adapter
      on the reference device, including successful generation and provider
      cancellation.
- [x] Record job provenance and validate every returned artifact.
- [x] Add unit tests for request construction and hostile prompt handling.
- [x] Add integration tests with a fake provider; keep physical ComfyUI tests
      manual and hardware-labelled until a controlled runner exists.

Gate: a user prompt produces a bounded candidate image without arbitrary node,
path, network, or command control; cancel and failure leave no partial project
revision.

### Automatic character lock (internal; not a user phase)

- [x] Generate and compare concept variants.
- [x] Add an explicit Accept design action.
- [x] Derive the private character specification and prompt-aware part
      inventory without asking the user to mark landmarks or fill a form.
- [x] Create the dependency graph from approved templates.
- [x] Freeze the private authoring-project schema only after review.

Gate: after reference acceptance, a saved project automatically round-trips the
accepted concept, private character specification, landmarks, part plan,
provider metadata, and rights state. No separate Phase P2 screen blocks users.

### Phase P3 - Purpose-generated part artwork

- [ ] Add the versioned anatomy-aware saved-part catalog for five reusable sets
      and the six-set avatar-kit chooser with a body-conditioned generated
      outfit, seeded prompt-selected compatible defaults, and per-set controls.
- [ ] Apply recoloring only through declared channel masks while preserving
      alpha, outlines, shading, and protected pixels.
- [ ] Expand accepted sets into required internal rig roles; keep teeth,
      tongue, catchlights, sparse lower lids, animal features, props, and other
      details capability-conditional.
- [ ] Generate only catalog misses in dependency order using shared anchors,
      neighboring saved sets, and the accepted design as conditioning; admit a
      result to the saved catalog only after review and validation.
- [ ] Produce full-canvas transparent layers with hidden overlap.
- [ ] Add automatic per-set variants, retry, selection, compatible-preset
      substitution, and bounded hidden-art inpainting.
- [ ] Add alpha, bounds, alignment, duplicate-content, and missing-part checks.
- [ ] Add a layer inspector with draw-order, solo, opacity, checkerboard,
      composite, and reference overlay views.

Gate: all six minimum sets reconstruct the approved neutral character without
using rectangular source patches, every enabled moving boundary has validated
hidden art, and absence of an optional micro-part does not block Motion Lab.

### Phase P4 - Assembly, correction, and exportable source

- [ ] Add non-destructive mask/paint correction, transform adjustment, and
      undo/redo.
- [ ] Validate eye and mouth clipping, draw order, anchors, and part hierarchy.
- [ ] Export/import the versioned private project deterministically.
- [ ] Export a Cubism-ready PSD with documented layer names and groups.
- [ ] Add clean-session round-trip and hostile-project tests.

Gate: project and PSD round trips preserve canvas alignment, hierarchy, alpha,
neutral composition, rights records, provenance, and limitations.

### Phase P5 - Auto-rig and Motion Lab

- [ ] Generate conservative meshes/deformers and mappings for gaze, blink,
      brows, mouth open/form, head X/Y, body/breath, and optional hair motion.
- [ ] Use the existing Open Avatar runtime for interactive preview.
- [ ] Add landmark, mesh, clipping, physics, and combined-parameter editors.
- [ ] Run deterministic parameter sweeps and visual regression at extremes.
- [ ] Export a validated Open Avatar bundle.

Gate: all art and rig acceptance checks pass; reset exactly restores neutral;
the exported bundle loads, controls, disposes, and reloads safely.

### Phase P6 - Prompt editing and revision management

- [ ] Add upload for this repository's generated project format.
- [ ] Add prompt interpretation, impact preview, and cost/time estimate.
- [ ] Implement texture-only, localized geometry, and full-version edit paths.
- [ ] Add before/after neutral and motion-extreme comparison.
- [ ] Add accept/reject, history, rollback, and provenance.

Gate: eye-color, hairstyle, and outfit tests preserve unaffected parts and
rerun all required downstream validation. Rejected edits cannot mutate the
accepted revision.

### Phase P7 - Cubism handoff

- [ ] Validate the layered PSD against current official Cubism import rules.
- [ ] Publish a parameter, part, draw-order, mask, and deformer handoff guide.
- [ ] Prove the handoff in the approved Cubism Editor version.
- [ ] Record which rigging steps are manual and which are reproducibly assisted.
- [ ] Validate exported `.moc3`, `.model3.json`, textures, motions, expressions,
      and physics in an approved Cubism SDK sample or viewer.

Gate: a reviewer can import the PSD, complete or verify the rig, export from
Cubism Editor, and run the resulting model. Only this artifact is labelled a
Live2D Cubism model.

### Phase P8 - Hardening and release readiness

- [ ] Complete accessibility, browser, visual, performance, cancellation,
      recovery, context-loss, soak, dependency, and supply-chain checks.
- [ ] Document model installation, workflow pins, hardware budgets, backup,
      migration, rights review, and troubleshooting.
- [ ] Add approval-gated release metadata, SBOM, checksums, and clean-install
      verification without publishing.
- [ ] Select project license, distribution policy, and supported-provider
      policy before any publish or deployment action.

Gate: `pnpm run ci` and all labelled physical-generation and Cubism evidence
pass; release remains blocked until license and explicit release approval.

## 11. First implementation slice after approval

The next slice is Phase P1 only:

1. preserve and audit the current uncommitted Studio changes;
2. extract a minimal private provider seam from any reusable ComfyUI logic;
3. implement endpoint health, one allowlisted workflow, progress, cancellation,
   output validation, and a fake-provider test;
4. do not add part generation, public schemas, or Cubism export yet; and
5. run `pnpm run ci` before handoff.

## 12. Evidence

Primary sources reviewed for this pivot:

- [ComfyUI workflow concepts](https://docs.comfy.org/development/core-concepts/workflow)
- [ComfyUI workflow submission](https://docs.comfy.org/api-reference/cloud/workflow/submit-a-workflow-for-execution)
- [Live2D Cubism PSD import](https://docs.live2d.com/en/cubism-editor-manual/psd-import/)
- [Live2D Cubism illustration processing](https://docs.live2d.com/en/cubism-editor-tutorials/psd/)
- [Live2D Cubism model files](https://docs.live2d.com/en/cubism-sdk-manual/model-web/)

Versions, licenses, provider APIs, and Cubism requirements must be rechecked at
the start of their implementation phase.
