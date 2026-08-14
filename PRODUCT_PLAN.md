# Product plan

## 1. Product goal

Create a game-style anime avatar designer that reliably produces a believable bust-up character. The product is not an arbitrary image collage and will not allow combinations that were never authored for the same base.

The initial deliverable prepares coherent layered artwork for Live2D Cubism or Inochi Creator. It must not claim to export a rigged model until a real mesh, deformer, parameter, and physics pipeline exists.

## 2. First-release scope

The first release supports one front-facing bust base called `standard-bust-v1`.

Included:

- head, neck, shoulders, torso, and covered bust proportions;
- feminine, masculine, and androgynous presentation presets expressed as bounded anatomy values;
- one coherent anime art-style pack;
- compatible head silhouettes, face presets, whole hairstyles, and bust outfits;
- skin, hair, eye, and outfit color controls using authored masks;
- neutral, smile, surprised, and talking visual references;
- PNG preview, editable project JSON, and a vendor-neutral layered rigging pack.

Excluded until the bust creator is visually approved:

- full body and hands;
- arbitrary user-imported PNG mixing;
- cross-style asset mixing;
- automatic Live2D/Inochi mesh generation;
- fake model files or fake landmark verification.

## 3. Interface layout

The workspace uses three permanent columns.

### Left — Character controls

The left panel changes properties of the selected character rather than choosing artwork files.

Sections:

1. **Character** — presentation preset, age range, overall scale, shoulder width.
2. **Head & face** — head width/height, cheek fullness, jaw width/length, chin shape.
3. **Body & bust** — torso width, neck width/length, shoulder slope, bust volume/spacing/height.
4. **Colors** — skin, blush, hair base/highlight, iris/pupil, outfit palette.
5. **Art style** — only complete compatible style packs; changing style reconciles every part.
6. **Advanced** — debug-safe numeric corrections, hidden by default.

Friendly presets such as Soft, Balanced, Sharp, Feminine, Masculine, and Androgynous are validated parameter bundles—not unrelated replacement images.

### Center — Result stage

The center is the largest area and always renders the actual selected state.

It contains:

- the character at a useful VTuber bust scale;
- zoom and background controls outside the character artwork;
- optional anatomy/socket overlay for development;
- a visible status: `Approved`, `Needs review`, or `Blocked`;
- no toolbars covering the face;
- no separate hidden export renderer.

Preview and exported PNG must come from the same scene graph and paint order.

### Right — Compatible parts

The right panel contains artwork choices:

- head preset;
- whole hairstyle;
- eyes and brows;
- nose;
- mouth/expression set;
- outfit;
- accessories attached to named sockets.

The catalog is filtered by base profile, registration version, layer contract, and art style. Incompatible parts are hidden by default. Debug mode may reveal them with the exact blocker, but cannot silently force them onto the character.

## 4. Interaction model

1. Select a base/style preset.
2. Adjust anatomy on the left.
3. Choose compatible parts on the right.
4. Every part follows the anatomy automatically through its parent socket.
5. Review rig-readiness and visual quality.
6. Export coherent layered artwork and metadata.

Raw X/Y placement is not part of the normal workflow. Any correction is stored as a small asset-local delta after automatic socket placement.

## 5. Anatomy-first rules

- One canonical anatomy graph owns all target sockets.
- Head changes update face, ears, hair, neck, and facial-feature sockets.
- Shoulder and torso changes update clothing anchors and bust masks.
- Bust changes update the covered body and garment deformation regions together.
- Hair is split into authored back/front groups but selected as one hairstyle.
- Clothing is authored for the base torso and shoulder contract.
- Accessories attach to explicit sockets such as ear, temple, crown, chest, or collar.
- No asset may use unexplained global coordinates.

## 6. Content strategy

Quality is expanded vertically, not through a large Cartesian catalog.

First approved content target:

- 1 canonical bust anatomy;
- 3 presentation presets on that anatomy;
- 3 head/face shape presets;
- 3 whole hairstyles;
- 3 face kits;
- 2 outfits;
- 1 accessory set;
- coordinated palettes.

Every item must be authored from the same base drawing/template and pass all visual combinations it advertises.

## 7. Milestones

### M0 — Contracts and wireframe

- Finalize normalized canvas, anatomy graph, sockets, parameter ranges, and manifest schemas.
- Build the three-column responsive UI with placeholder geometry only.
- Show anatomy and socket debug overlays.

Exit condition: moving any anatomy parameter visibly moves every dependent placeholder through the transform graph.

### M1 — One coherent base

- Author one neutral bust base in separated layers.
- Add skin and line-art masks.
- Implement renderer and shared preview/PNG export.

Exit condition: the neutral character has correct head/body/neck proportions at desktop and mobile sizes.

### M2 — Real customization

- Add presentation/shape presets and bounded morph/deformer values.
- Add one hairstyle, one face kit, and one outfit using the asset contract.
- Implement color masks.

Exit condition: every control changes the real composed result without manual positioning.

### M3 — Compatible catalogs

- Expand to the first-release content target.
- Add strict compatibility filtering and migration-safe saved projects.
- Add screenshot-based combination tests.

Exit condition: every selectable combination is visually reviewed and passes registration thresholds.

### M4 — Rigging preparation

- Export named full-canvas PNG layers, landmarks, hierarchy, draw order, parameter intentions, and provenance.
- Validate completeness and clipping.
- Round-trip the pack through an external rigger workflow.

Exit condition: a rigger can import the pack without renaming or manually repositioning layers.

### M5 — Runtime animation proof

- Author one real rig externally in Inochi Creator or LoongBones/DragonBones.
- Load and drive that rig in the browser.
- Keep rig playback separate from unrigged artwork preparation.

Exit condition: blink, gaze, mouth open, head XY/Z, and breathing are driven by real rig parameters.

## 8. Acceptance criteria

The app is not considered usable until:

- the selected head and body appear drawn as one character;
- hair wraps around the skull and respects front/back occlusion;
- neck terminates cleanly inside the collar;
- eyes, nose, and mouth follow face shape changes;
- shoulders remain within approved anime proportions;
- every advertised hair/outfit combination has a golden screenshot;
- no status says “verified” without measuring source and target landmarks;
- mobile UI keeps the center result visible while controls remain reachable;
- PNG export visually matches the stage.

## 9. Non-negotiable visual quality bar

The target is a professional anime VTuber bust, not a placeholder, children’s drawing, paper-doll collage, or technically valid monster.

### Static art review

Before an asset is selectable:

- silhouette reads as a believable anime person at thumbnail size;
- head-to-shoulder ratio matches the approved base reference;
- skull, forehead, cheeks, jaw, chin, ears, and neck form one coherent anatomy;
- facial features share one perspective and center line;
- hair has scalp volume, a readable hairline, clean front/back occlusion, and no wig gap;
- collar encloses the neck cleanly;
- outfit follows shoulders, torso, and bust without floating or stretching artifacts;
- line weight, palette, lighting direction, and shading style match the complete style pack;
- transparent edges are clean at 100% and 200% zoom;
- hidden content needed for head turns and deformation is painted beyond visible boundaries.

Approval requires visual review of the actual app composition. A separately generated or flattened picture cannot be used as evidence that the creator works.

### Rig and motion review

A final animated model must demonstrate:

- smooth head X/Y turns and Z tilt without face collapse;
- stable eye placement, independent blinking, gaze, and brows;
- mouth open/close plus useful vowel shapes without stretching the entire face;
- neck and shoulders deforming together;
- front hair, side locks, and back hair with restrained physics and correct occlusion;
- clothing and bust deformation without layer gaps;
- no exposed transparent holes during the approved parameter range;
- stable behavior at neutral and extreme tested poses.

The app may use the phrase `Live2D model` only after the exported project is successfully loaded and exercised by the intended runtime/editor. Until then, outputs are labeled `rigging artwork` or `rigging preparation`.

## 10. Quality checkpoints

Development is reviewed in this order:

1. **Anatomy checkpoint** — geometry-only bust with sockets and proportion presets.
2. **Neutral art checkpoint** — one separated, coherent character inside the real renderer.
3. **Customization checkpoint** — every enabled control preserves anatomy and style.
4. **Catalog checkpoint** — every advertised combination passes visual snapshots.
5. **Rig checkpoint** — real parameterized model passes motion review.

Failure at any checkpoint blocks additional categories or assets. Catalog size and feature count never override character quality.

Detailed agent ownership, independent review, evidence, veto, repair, recreation, and provenance rules are defined in [MULTI_AGENT_PLAN.md](./MULTI_AGENT_PLAN.md). Those rules are mandatory for every checkpoint.

## 11. Decision gate before coding assets

Implementation must pause after M0 until the neutral anatomy wireframe is reviewed. Decorative art must not be generated or imported before the socket graph and target proportions are accepted.
