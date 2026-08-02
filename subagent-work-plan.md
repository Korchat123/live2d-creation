# Work Ownership Plan for the Prompt-to-Live2D Pivot

Status: draft; task execution begins only after the corresponding gate is
approved

Canonical scope: `live2d-model-plan.md`

This file defines ownership and dependency order. It does not authorize
publishing, deployment, signing, committing, pushing, installing unreviewed
models, or replacing the current uncommitted Studio work.

## Operating rules

- The root agent owns product-plan integration, cross-package contracts, gate
  decisions, and final repository-wide verification.
- One task has one primary owner and a declared write scope.
- An owner must inspect existing changes in its scope before editing and must
  preserve unrelated work.
- Applications may consume package entry points; packages never import from
  applications.
- Internal dependencies use explicit `workspace:` ranges.
- New project, generation, and Cubism contracts remain private and must not be
  frozen before their scheduled approval.
- Prompts, workflows, uploaded bundles, provider results, and commands are
  hostile data.
- Generated images, references, checkpoints, local provider state, recordings,
  credentials, environment files, build output, and release archives are not
  committed.
- Each behavior change includes automated CI coverage.
- Each task handoff states changed files, verification, assumptions, and
  remaining risks.
- The root agent runs `pnpm run ci` before integrated handoff.

## Existing dirty-work ownership

The following files had uncommitted work when this plan was written:

- `apps/studio/src/authoring.ts`
- `apps/studio/src/main.ts`
- `apps/studio/src/motion.ts`
- `apps/studio/src/style.css`
- `apps/studio/test/authoring.test.ts`
- `apps/studio/vite.config.ts`

They are reserved for the current Studio authoring task until the root agent
records their owner and intent. No other task may rewrite, format, revert, or
move them. Phase P1 starts with an audit of this work and integrates reusable
pieces through narrow patches.

## Shared definition of done

A work item is complete only when:

- its phase dependency and approval are recorded;
- outputs stay inside the declared write scope;
- new external dependencies and models have license and version evidence;
- failure, cancellation, limits, accessibility, and hostile-input behavior are
  tested where relevant;
- documentation distinguishes generated projects, Open Avatar bundles,
  Cubism-ready PSDs, and genuine Cubism models;
- scoped checks pass; and
- the owner hands results to the root agent without publishing or committing
  unless the root task explicitly authorizes it.

## Wave P0 - Product and feasibility decisions

Run `P0-A`, `P0-B`, and `P0-C` as read-only or documentation-only studies.
`P0-D` integrates them.

### P0-A - Output and Cubism boundary

Owner role: product/format agent

Write scope:

- `docs/adr/0001-runtime-and-format.md`
- a new Cubism handoff ADR if approved by the root agent

Deliverables:

- decision record for the approved dual-output product: Open Avatar is the
  default automated path and Cubism is the optional Editor handoff;
- exact terminology for generated project, Open Avatar bundle, Cubism-ready
  PSD, `.cmo3`, `.moc3`, and `.model3.json`;
- current official Cubism import/export and licensing constraints;
- feasibility boundary for Cubism project import and automation.

Acceptance:

- does not claim that ComfyUI output is a `.moc3`;
- identifies the step and tool that creates the genuine Cubism artifact;
- leaves disputed licensing or automation claims blocked.

### P0-B - Generation provider and hardware study

Owner role: generation systems agent

Write scope:

- `docs/architecture/generation-provider.md`
- `docs/phase-status/phase-p0.md`

Deliverables:

- local ComfyUI transport, health, queue, progress, cancellation, and artifact
  retrieval study;
- reference Windows/GPU/VRAM/storage/generation-time budget;
- core-node versus custom-node capability matrix;
- model/checkpoint/LoRA version and license inventory template;
- fake-provider testing strategy.

Acceptance:

- does not install or download a checkpoint without explicit authorization;
- separates documented ComfyUI behavior from proposed adapter behavior;
- lists manual physical tests that cannot run in ordinary CI.

### P0-C - Rights, privacy, and threat update

Owner role: security/rights agent

Write scope:

- `docs/security/threat-model.md`
- `docs/authoring/rights-checklist.md`

Deliverables:

- threats for prompt injection, hostile workflows, image metadata, malformed
  outputs, archive bombs, local endpoint access, cloud credentials, and
  unauthorized references;
- rights fields for source references, checkpoints, LoRAs, generated output,
  trademark review, and redistribution;
- local/cloud privacy and consent boundary.

Acceptance:

- generated output is not automatically declared original or redistributable;
- untrusted projects cannot execute embedded workflows or commands;
- secrets never enter exports or browser bundles.

### P0-D - Pivot review

Owner role: root agent

Depends on: `P0-A`, `P0-B`, `P0-C`

Deliverables:

- reconcile ADR, product plan, security, rights, and hardware decisions;
- audit the existing dirty Studio files and record their intended integration;
- record the human-approved default Open Avatar plus optional Cubism output
  decision;
- obtain human approval for provider, hardware, rights, and detailed Cubism
  handoff;
- record the P0 gate status.

Acceptance:

- unresolved decisions remain visibly blocked;
- no implementation contract is invented to bypass approval;
- existing runtime work has an explicit reuse disposition.

## Wave P1 - Safe provider spike

Run `P1-A` first. `P1-B` and `P1-C` can then proceed against the approved
private seam. `P1-D` integrates the slice.

### P1-A - Private provider seam and fake

Owner role: generation systems agent

Depends on: `P0-D`

Write scope:

- new private provider code in an approved package or Studio-local module;
- its unit tests and fixtures;
- no edits to reserved dirty files until the audit assigns them

Deliverables:

- health/capability, submit, progress, cancel, and result concepts;
- bounded request/result diagnostics;
- deterministic fake provider for CI;
- lifecycle and cancellation tests.

Acceptance:

- provider-specific workflow nodes do not enter existing public runtime types;
- cancellation settles every pending operation;
- fake results exercise invalid MIME, dimensions, bytes, and missing alpha.

### P1-B - Reviewed ComfyUI adapter

Owner role: ComfyUI integration agent

Depends on: `P1-A`

Write scope:

- approved adapter directory;
- versioned workflow templates;
- adapter tests and documentation

Deliverables:

- explicitly configured local endpoint;
- health and required-capability checks;
- one reviewed allowlisted workflow;
- asynchronous progress, cancellation, and bounded artifact retrieval;
- workflow, checkpoint, seed, prompt, adapter, and artifact provenance.

Acceptance:

- user text can alter only approved template input fields;
- uploaded projects cannot submit workflow graphs;
- node, path, URL, checkpoint, file-count, pixel, byte, queue, and time controls
  are enforced;
- physical ComfyUI evidence is hardware-labelled and kept out of CI fixtures.

### P1-C - Prompt workspace

Owner role: Studio UX agent

Depends on: `P1-A`

Write scope:

- the six reserved Studio files after `P0-D` assigns them;
- additional `apps/studio/` files and Studio tests

Deliverables:

- accessible prompt field;
- endpoint/health and capability state;
- approved model/template selection;
- Generate, progress, cancel, retry, and actionable errors;
- candidate preview that is not silently accepted into a project.

Acceptance:

- keyboard operation and 200% zoom remain usable;
- duplicate submissions are prevented;
- navigation, cancel, provider failure, and invalid result do not create a
  partial accepted revision;
- all new behavior uses the fake provider in CI.

### P1-D - Provider spike integration

Owner role: root agent  
Depends on: `P1-A`, `P1-B`, `P1-C`

Deliverables:

- review package direction and private boundaries;
- reconcile overlapping Studio edits;
- run repository CI and the labelled manual provider smoke test;
- record Phase P1 status.

Acceptance:

- one prompt safely produces one bounded candidate;
- no arbitrary workflow, node, path, network target, or command is controlled
  by prompt text;
- cancellation and failure clean up all temporary state.

## Internal character lock - folded into the automatic build

This is not a user-facing phase. After the user accepts the neutral master,
Studio creates the private specification and continues without landmark,
manifest, or character-bible forms.

### LOCK-A - Private authoring project

Owner role: project/schema agent

Depends on: `P1-D`

Write scope:

- approved private project module;
- project fixtures and tests;
- authoring format documentation

Deliverables:

- versioned project representation for immutable source, accepted concept,
  character bible, landmarks, part graph, revisions, provenance, rights, and
  limitations;
- deterministic save/load and migrations;
- resource and archive limits.

Acceptance:

- round-trip is deterministic;
- unknown major versions and hostile paths/files are rejected;
- no executable provider workflow or secret is serialized.

### LOCK-B - Automatic identity/specification derivation

Owner role: Studio UX agent

Depends on: `LOCK-A`

Write scope: `apps/studio/` and its tests

Deliverables:

- concept variant comparison and explicit Accept design action;
- automatic private character specification, orientation, landmarks, and
  prompt-aware part plan;
- automatic capability and motion-envelope validation;
- direct continuation into the build after acceptance or explicit resume.

Acceptance:

- no part job starts before neutral-master acceptance;
- changing identity-locked fields produces a new reviewed revision;
- project reload preserves the exact accepted concept and plan;
- no user landmark marking or intermediate Phase P2 form is required.

### LOCK-C - Internal-lock integration

Owner role: root agent

Depends on: `LOCK-A`, `LOCK-B`

Deliverables:

- approve the private project boundary;
- verify it does not leak into unrelated public control contracts;
- run CI and hostile-project tests;
- record the automatic character-lock status.

## Wave P3 - Purpose-generated part artwork

After `LOCK-C`, `P3-A` and `P3-B` may proceed in parallel. `P3-C` integrates.

### P3-A - Part generation orchestrator

Owner role: generation systems agent

Write scope:

- approved generation/orchestration package;
- workflow templates, fixtures, and tests

Deliverables:

- private immutable canonical avatar-kit catalog for body, face, paired-eye,
  mouth, hair, and outfit sets, including catalog revision, anatomy profile,
  compatibility, anchors, palette-channel masks, topology, internal roles,
  provenance, rights, and optional capabilities;
- seeded prompt-to-saved-set planning, bounded recoloring, plus per-set ComfyUI
  generation only for catalog misses and reviewed-preset substitution when a
  candidate cannot satisfy geometry or style gates;
- immutable neutral-master and non-exported authoring-reference-pack jobs;
- separate false-color ownership, edge, pose, landmark, expression-candidate,
  and concealed-candidate records with registration and provenance;
- dependency-ordered set and internal-part jobs conditioned on the character
  bible and shared anchors;
- full-canvas alpha artifacts, stable IDs, anchors, overlap targets, variants,
  retry, and cancellation;
- material-specific solver selection plus merge, bake, rigid-group, replacement,
  and reduced-motion fallbacks;
- result validation, checkpoint/resume, and provenance.

Acceptance:

- the six minimum sets always have compatible defaults and expand into the
  conservative basic-motion inventory;
- the same prompt, catalog revision, and seed choose the same saved entries;
  selection cannot cross incompatible anatomy profiles;
- a palette change cannot modify alpha, protected outlines, or undeclared
  channels, and a generated catalog miss cannot mutate accepted neighboring
  sets;
- teeth, tongue, absent catchlights/lower-lid strokes, animal features, props,
  and other optional capabilities cannot block a basic avatar;
- accepted parts are full-canvas semantic layers, not rectangular source
  crops; their visible portion may preserve exact accepted-reference pixels,
  while concealed overlap is separately generated and validated;
- expression variants cannot modify pixels outside their accepted local masks;
- a failed generated guide cannot replace a guide registered to the neutral
  master, and no temporary guide color enters exported artwork;
- retries cannot mutate accepted parts;
- all required roles and concealed overlaps are measurable.

### P3-B - Automatic diagnostics and recovery UI

Owner role: authoring UX agent

Progress on 2026-08-01: the explicit persisted front-reference
accept/reject/regenerate gate is complete, including immutable acceptance,
rejection notes, candidate history, reload/resume, and downstream blocking.
Authoring-constraint diagnostics, technical-pack status, automatic per-part
gates, and final Motion Lab handoff remain pending.

Write scope: `apps/studio/` and its tests

Deliverables:

- explicit front-reference accept/reject/regenerate gate;
- authoring-constraint preview and immutable neutral-master/reference-pack
  status;
- final/recovery part list, solo/visibility/opacity/draw-order controls;
- registered false-color/edge/pose/landmark guide views, checkerboard,
  source/mask overlay, isolated visible RGBA, assembled context,
  reconstruction wipe, coverage/duplicate/seam heatmaps, and neutral composite;
- automatic per-part confidence/diagnostics, retry and candidate selection;
- exception-only replace, merge, bake, rigid-group, motion-reduction, and
  bounded correction tools;
- visible-only, generated-hidden-only, and completed-part diagnostics;
- accessible undo/redo.

Acceptance:

- active part and revision are always visible;
- users can identify alpha, alignment, overlap, and draw-order errors;
- failed automated gates block hidden generation, rigging, and export;
- accepted edits invalidate dependent hidden fill and motion checks;
- original references and accepted revisions remain recoverable.

### P3-C - Art-quality integration

Owner role: root agent with QA/art review

Depends on: `P3-A`, `P3-B`

Deliverables:

- neutral and overlap visual baselines;
- labelled opaque, black-on-black, hair/hat, lace/ruffle, translucent, shadow,
  and hand/prop fixtures with expected fallback decisions;
- required-part, guide-registration, protected-pixel, alignment, matting, alpha,
  duplicate, z-order, hidden-art, expression-isolation, and motion-sweep checks;
- 40-layer storage round-trip, cancellation/recovery, corrupt/quota, 60-second
  FPS/memory soak, and deterministic export/import evidence;
- final Motion Lab user-test record.

Acceptance:

- neutral reconstructs the approved concept;
- all moving boundaries have sufficient hidden art;
- every accepted artifact has rights and generation provenance.

## Later waves

Detailed implementation tasks for P4-P8 are created only after P3 freezes the
project and part boundaries.

Expected ownership:

- P4 project correction and PSD export: authoring, exporter, and validation
  owners.
- P5 auto-rig and Motion Lab: core runtime, graphics, and motion QA owners.
- P6 prompt edits: change-planning, generation, Studio UX, and regression QA
  owners.
- P7 Cubism handoff: format/licensing, authoring, and interoperability QA
  owners.
- P8 hardening: accessibility, security, performance, documentation, and
  release-readiness owners.

No later-wave task may claim automated `.moc3` creation unless P7 records an
officially supported and licensed method.

## Root-agent integration checklist

- Confirm dependencies and gate approvals.
- Identify and preserve all pre-existing working-tree changes.
- Review every new project, provider, schema, and export boundary before a
  consumer depends on it.
- Check application-to-package dependency direction and explicit `workspace:`
  ranges.
- Review provider/model licenses and lockfile changes.
- Verify prompt, workflow, bundle, file, network, and resource limits.
- Run scoped tests during integration and `pnpm run ci` before handoff.
- State changed files, verification, assumptions, and remaining risks.
- Request human approval at creative, security, Cubism, license, and release
  gates.
