# Multi-agent production and evaluation plan

## 1. Governing rule

No agent may approve its own work. Every milestone has:

1. a builder;
2. an independent evaluator with veto authority;
3. a fix or recreation owner;
4. a provenance auditor that confirms the judged result is real product output.

The only evaluation outcomes are `PASS`, `FAIL`, or `BLOCKED_BY_MISSING_EVIDENCE`. There is no “pass with concerns.” A blocker or major visual defect fails the milestone.

If the exact image being judged cannot be reproduced from declared parts and parameters in a clean build, it is not product output and automatically fails.

Every work package also follows [VERSION_CONTROL.md](./VERSION_CONTROL.md). A local-only candidate or evaluation is incomplete; builders and evaluators must push their separate branches and record exact SHAs in [FEATURE_TRACKER.md](./FEATURE_TRACKER.md).

## 2. Agent roles

### Product architect / root coordinator

Owns scope, contracts, scheduling, and cross-team decisions. It does not override evaluator vetoes and cannot substitute a polished reference for unfinished implementation.

### Art director

Defines the professional anime target before production art:

- apparent age and gender-presentation range;
- measured front-bust proportions;
- skull, face, jaw, neck, shoulders, torso, and bust construction;
- hair volume and hairline rules;
- line weight, palette, lighting, and shading rules;
- forbidden deviations and quality references.

Deliverables: character bible, proportion overlay, palette, annotated neutral target, and explicit rejection examples. The Art Director cannot approve final production assets.

### Anatomy graph builder

Owns `standard-bust-v1`, node hierarchy, sockets, local/world matrices, symmetry, and debug geometry. It uses no decorative art.

Hard rule:

```text
partWorld = parentSocketWorld × assetAttachment × boundedAssetLocalCorrection
```

Global per-part stage coordinates and unexplained CSS positioning are forbidden.

### Parameter builder

Owns parameter ranges, presentation presets, derived anatomy constraints, and propagation to downstream nodes. It cannot edit renderer layout to conceal graph defects.

### Renderer/export builder

Owns one SVG scene graph for center preview, serialized SVG, and PNG rasterization. Preview and export cannot have separate character-layout logic.

### UI/UX builder

Owns the three-column interface:

- left: anatomy, proportions, color, gender presentation, body/bust, and style;
- center: largest permanent real result stage;
- right: compatible part catalog.

UI controls dispatch state into the graph; they never directly position rendered anatomy.

### Layered character artist

Creates production layers from the approved canonical design: back hair, body/neck, outfit pieces, face/ears, eye components, nose, mouth components, front hair, and accessories. Each layer contains real hidden overlap for deformation. A flattened master cut into unusable rectangles is not acceptable separation.

### Compatibility catalog builder

Adds alternatives only against the same base profile, style pack, sockets, registration version, and layer contract. New items include manifests, source landmarks, safe parameter ranges, and app-rendered catalog thumbnails.

### Rig builder

Creates the actual editable Cubism/Inochi/approved alternative rig and runtime export. It owns meshes, deformers, keyforms, masks, draw order, parameters, and physics.

### Independent visual QA evaluator — veto authority

Reviews actual running-app compositions at neutral and extreme states. It cannot edit the evaluated work.

### Independent technical/rig QA evaluator — veto authority

Runs graph, renderer, export, layer-integrity, editor import, runtime load, and motion stress tests. It cannot accept still images or videos instead of editable/runtime artifacts.

### Provenance auditor — anti-cheating authority

Reconstructs outputs from a clean launch, records source hashes and state, hides layers independently, and confirms production code cannot load reference-only master pictures.

## 3. Work packages and dependencies

P0 is a mandatory predecessor to WP-A and WP-B. The pushed `CHARACTER_BIBLE.md` candidate must receive an independent Gate A `PASS` before either builder implements neutral geometry or parameter bounds. WP-B may narrow approved ranges but cannot widen or reinterpret them without a new bible version and Gate A review.

### WP-A — Canonical anatomy graph

Deliverables:

- typed node hierarchy and transform traversal;
- required named sockets;
- neutral debug silhouette and socket overlay;
- cycle/orphan/duplicate rejection;
- neutral and boundary coordinate fixtures.

Tests prove parent changes propagate to every descendant, graph output is deterministic, left/right order remains valid, and no part declares arbitrary global placement.

### WP-B — Parameter propagation

Starts after WP-A’s API freezes.

Deliverables:

- central parameter registry with units, defaults, and safe bounds;
- feminine, masculine, and androgynous bounded presets;
- dependency map for every parameter;
- reconciliation constraints for unsafe combinations;
- pure `evaluateCharacter(parameters)` output.

Tests cover single controls, combined extremes, symmetry, positive dimensions, eye/nose/mouth ordering, neck-inside-shoulders, and unaffected-node stability.

### WP-C — Renderer and export parity

Starts when WP-A provides fixtures and integrates fully after WP-B.

Deliverables:

- one SVG character scene;
- deterministic paint order, clipping, masks, and overlays;
- stage/export state identity;
- PNG generated by rasterizing the same serialized scene;
- node-to-socket provenance report.

Any hidden replacement image, export-only correction, renderer-owned anatomy transform, or separate preview/export formula is an automatic failure.

### WP-D — Three-column UI

The shell may run in parallel with WP-A using debug geometry. Real integration depends on WP-A through WP-C.

Tests cover desktop/mobile layout, visible center result, keyboard flow, undo/reset, rapid slider updates, compatible selection, and camera zoom that never changes export geometry.

### WP-E — Canonical art pack

Begins only after the M0 anatomy evaluator passes.

Deliverables:

- genuinely separated source art;
- isolated layer exports and manifests;
- overlap/deformation-bleed map;
- assembly produced by the real renderer;
- 100% and 200% app-rendered review captures.

### WP-F — Compatible catalog

Begins only after the neutral art pack passes. Every advertised combination is rendered automatically. Incompatible parts are blocked before composition.

### WP-G — Rig and runtime proof

Begins after layer-integrity approval. Deliverables include the editable rig, runtime model, parameter map, import evidence, motion captures, and stress-test results.

## 4. Execution waves with four agent slots

### Wave 0 - Character specification

- Slot 1: Art director authors the measurable character bible and rejection fixtures.
- Slot 2: Anatomy consultant checks construction feasibility without implementing production geometry.
- Slot 3: Independent evaluator performs Gate A and may veto the specification.
- Root coordinates scope and cannot override Gate A.

No M0 anatomy, parameter, renderer integration, or decorative art implementation begins before Wave 0 passes.

### Wave 1 — M0 foundations

- Slot 1: Anatomy graph builder.
- Slot 2: UI/UX builder using debug geometry.
- Slot 3: Independent evaluator prepares fixtures and review harness.
- Root: contract coordination and integration review.

### Wave 2 — Graph behavior

- Parameter builder starts after graph API freeze.
- Renderer builder starts with approved graph fixtures.
- UI builder connects to public graph state only.
- Evaluator tests neutral, presets, and combined boundaries.

### Wave 3 — Canonical art

- Art director freezes the character bible.
- Layered artist creates one neutral pack.
- Renderer/UI agents integrate real layers without special-case offsets.
- Visual QA and provenance audit review actual app composition.

### Wave 4 — Catalog

- Catalog builder creates one compatible family at a time.
- Anatomy/renderer owner supplies automated combination capture.
- Visual QA rejects individual parts or entire families.
- Structural failures are assigned to a different recreation owner.

### Wave 5 — Rig

- Rig builder authors the real model.
- Technical QA sweeps all parameters and combined extremes.
- Provenance auditor verifies runtime artifacts match approved source layers.

## 5. Quality gates

Gate A uses the versioned neutral landmarks, ratios, allowed presentation ranges, ordering invariants, attachment rules, tolerances, and silhouette rejection fixtures in `CHARACTER_BIBLE.md`. Evidence covers neutral, all presets, min/max, and combined extremes. Gate B additionally computes rendered measurements against that exact approved bible version.

### Gate A — Character specification

Pass requires measured proportions and a consistent anime visual language. “Looks anime” is not measurable evidence.

### Gate B — Anatomy and propagation

Pass requires every dependent socket to follow its parent across neutral, preset, min/max, and combined-boundary states. Detached features, impossible anatomy, floating neck/collar, child drift, or monster-like proportions fail.

### Gate C — Static coherent assembly

Pass requires the real layered scene to read as one professionally drawn character. Wig gaps, style mismatch, pasted features, bad skull/jaw/neck relationships, broken occlusion, incompatible outfit anatomy, T-pose artifacts, or childlike draft quality fail.

### Gate D — Customization robustness

Pass requires every enabled control and selectable combination to preserve anatomy, registration, shading, and style. Passing the default alone is prohibited.

### Gate E — Layer integrity

Pass requires usable hidden overlap, independent eye/mouth components, meaningful hair separation, consistent pivots, masks, and no hidden master-image fallback.

### Gate F — Rig validation

Pass requires an editable rig and runtime model that demonstrate head X/Y/Z, gaze, blink, brows, mouth open/form, breathing, body motion, and hair physics without holes, clipping, mesh folding, or layer slipping.

### Gate G — Product usability

Pass requires a first-time tester to understand left/center/right ownership, create a coherent character, understand blocked choices, return to a safe default, and export the exact center result.

### Gate H — Provenance

Pass requires a clean build to reproduce approved outputs from versioned source layers, manifests, parameters, renderer version, and rig artifacts.

Failure at an earlier gate blocks later feature or catalog expansion.

## 6. Required evidence bundle

Every evaluation submission includes:

- exact commit or workspace state;
- reproduction commands and complete test output;
- serialized project/parameter state;
- desktop and mobile running-app captures;
- neutral, all presets, relevant min/max, and combined extremes;
- anatomy/socket and layer-bound overlays;
- stage-versus-export comparison;
- source inventory, layer manifest, hashes, and provenance;
- complete combination matrix for catalog work;
- editor/runtime load evidence and motion recording for rig work.

Missing evidence produces `BLOCKED_BY_MISSING_EVIDENCE`, never a pass.

## 7. Defect report and repair loop

Every failure uses:

```text
Gate:
Result: FAIL
Severity: Blocker | Major | Minor
Exact state and viewport:
Observed defect:
Expected behavior:
Evidence path:
Affected layers/nodes/sockets:
Evidence-based likely cause:
Required correction:
Recreate required: yes/no
Regression test to add:
Retest scope:
```

Loop:

1. Evaluator freezes milestone promotion and files defects.
2. Root assigns each defect to a fix or recreation owner.
3. Owner adds a failing regression test where feasible.
4. Owner repairs only the cause or recreates the asset/system.
5. Original evaluator reruns the failed state, neighboring extremes, all previous gates, export parity, and responsive checks.
6. New regressions reopen the gate.
7. Only a clean full rerun changes `FAIL` to `PASS`.

## 8. Patch versus recreation policy

Patch only localized defects that preserve the canonical construction: small pivot/landmark corrections, mask cleanup, slight palette correction, safe-range reduction, or local mesh/draw-order fixes.

Require recreation when:

- head, hair, body, or outfit targets another base;
- hair lacks skull fit or meaningful front/back separation;
- neck and collar fundamentally disagree;
- the face needs several unrelated position/scale hacks;
- line style, perspective, lighting, or shading cannot be matched locally;
- large nonuniform scaling/warping is required;
- hidden deformation artwork is missing;
- rigging compensates for bad source anatomy;
- fixing one valid pose breaks another;
- three or more major landmarks miss tolerance;
- the same structural defect survives two review cycles;
- an asset passes only one specially tuned preset;
- the result reads as a collage, wig, costume overpaint, child drawing, or monster.

A recreated item returns through its full gate. Rejected assets remain archived with their defect report and cannot silently re-enter the catalog.

## 9. Explicit anti-cheating rules

Immediate failure for:

- inserting a generated or hand-edited finished character as app output;
- hidden master images, screenshots, baked previews, conditional review artwork, or export substitutes;
- reference images accessible to the production renderer;
- showing a control that does not affect real scene layers;
- cropping screenshots to hide defects;
- omitting supported combinations from evidence;
- manual one-off offsets created only to pass one screenshot;
- weakening tests, blindly accepting snapshots, or widening tolerances after failure;
- claiming `Approved`, `Live2D`, `rigged`, or `compatible` without measured/import/runtime evidence;
- using automated test success to overrule an independent visual failure.

Generated images may be stored only as clearly labeled art-direction references outside production asset paths. If generative tools contribute production art, the result must be genuinely separated/redrawn into riggable components and pass the same layer, combination, provenance, and rig gates as human-authored art.

## 10. Reconstruction audit

For every approved character, the provenance auditor must:

1. launch from a clean build;
2. load the declared project state;
3. hide each major layer and confirm the corresponding region disappears;
4. change anatomy, hair, face, expression, color, and outfit within supported ranges;
5. reproduce stage and export from the declared scene graph;
6. scan production assets and code for undeclared full-character images;
7. verify every visible layer’s parent chain and source hash;
8. confirm the final runtime rig uses the same approved separated art.

The evaluator’s veto cannot be waived for schedule, feature count, or presentation quality.
