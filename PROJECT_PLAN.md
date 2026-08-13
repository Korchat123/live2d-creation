# Live2D Parts Studio — initial plan

## Product idea

Let a user build a character by choosing from approved, compatible parts. The workspace should make the current selection obvious, keep the character visible while browsing, and prevent incompatible combinations before export.

## First user flow

1. Start from a base character template.
2. Choose a category: base, hair, eyes, outfit, or accessories.
3. Browse and select one prepared part at a time.
4. Inspect the combined character in the center preview.
5. Review selected parts and compatibility notices.
6. Save a draft configuration; export only after a later Live2D pipeline is approved.

## Information architecture

- **Top bar:** project identity, draft status, save, and future export action.
- **Category rail:** stable navigation between part groups.
- **Parts browser:** search/filter area and visual choice cards.
- **Preview stage:** assembled character, zoom controls, and reset view.
- **Inspector:** current selection, color variants, layer order, and warnings.
- **Status bar:** selection count and compatibility summary.

## Delivery phases

### Phase 1 — UI outline (current)

- Responsive desktop-first shell.
- Selection behavior with unavailable future categories clearly disabled.
- First illustrator-reviewed Japanese anime face-base draft in the preview.
- Tests for selection-state rules.

### Phase 2 — asset contract

- Agree on supported source formats, dimensions, anchor points, naming, masks, and thumbnails.
- Define compatibility metadata and validate imported bundles as hostile input.
- Approve a versioned internal manifest before implementation.

### Phase 3 — composer

- Load real approved parts.
- Render layers in deterministic order.
- Add color variants, undo/redo, autosave, and project persistence.
- Add keyboard and screen-reader workflows.

### Phase 4 — Live2D pipeline

- Decide whether parts are combined before rigging or mapped into a prepared Cubism model.
- Integrate the approved Cubism runtime and licensing policy.
- Validate parameters, textures, motions, physics, and export constraints.

### Phase 5 — release readiness

- Performance and cross-browser testing.
- Asset provenance, licensing, security, and privacy review.
- Packaging and release approval.

## Decisions needed before Phase 2

- Are parts flat PNG/WebP layers, PSD-derived layers, or pre-rigged Cubism assets?
- Must every combination animate, or is the first milestone a static character builder?
- Who creates and approves anchor points and compatibility metadata?
- Is output a saved project, a rendered image, or an actual Cubism model package?

## Current assumptions

- The initial catalog is curated rather than uploaded by end users.
- One item is active in each ready category; accessories can become multi-select later.
- Desktop web is the first target, with a compact mobile layout.
- Export remains disabled until the asset and Live2D contracts are approved.

## Art direction established

- Japanese anime character-design proportions with warm-brown linework and restrained cel shading.
- Every interchangeable part uses a fixed square canvas and shared registration anchors.
- Face base contains only the head and ears; neck, hair, eyes, nose, and mouth remain separate.
- Generated images are production drafts and require alpha, alignment, and overlay review before approval.
- Anatomy sources use ten named human anime proportion styles, each with female, male, and androgynous variants, organic joint shapes, and a shared 2048 × 2048 T-pose registration canvas; robot and mechanical anatomy are out of scope.
- Male and androgynous anatomy kits use 28 layers for upper/lower torso, shoulders, arms, hands, legs, feet, head, ears, and neck; female kits add a separate covered bust-motion layer.
- Joint layers deliberately overlap their parent and child segments for later rotation-deformer and Glue setup.
- Bust selection is independent from body gender and uses paired registered layers with bounded volume, spacing, and height controls.
- Face bases match the anatomy style/gender catalog and expose bounded overall scale, head-width, jaw-width, and jaw-length controls; UI values map to future Cubism parameters rather than unrestricted image distortion.
- Hair uses a shared face registration with separate back, front, side-lock, nape, crown, and style-specific tail/bun/braid/ahoge layers for future deformers and physics.
- Eyes use paired brow, sclera, iris, pupil, highlight, and upper/lower lash regions for future blink and gaze parameters.
- Outfits use a standard T-pose registration and separate collar, torso, waist, lower garment, sleeve, cuff, legwear, footwear, and center-detail regions.
- A final preview composes the currently selected body, covered bust, outfit, head, eyes, and hair so registration failures are visible before Cubism export work begins.
