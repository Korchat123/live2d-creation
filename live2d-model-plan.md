# Open 2D Avatar - Product and Delivery Plan

Status: planning  
Working name: Open Avatar  
Repository name: `live2d-model` (legacy name; product language must use
"Open 2D Avatar")

## 1. Product goal

Build an original, portable 2D avatar system that a human or an AI can control
through the same public API. The finished product must:

- render an original layered and deformable avatar in modern browsers;
- accept real-time input from a human controller, keyboard, pointer, tracking
  source, script, or AI agent;
- expose stable TypeScript and provider-neutral JSON control contracts;
- support expressions, gestures, gaze, blinking, body/head pose, and lip sync;
- validate and safely load third-party Open Avatar bundles;
- run without Live2D Cubism Core, SDK, Editor, or model formats;
- ship as reusable packages, a controller/preview app, documentation, examples,
  and a distributable avatar bundle.

It will not generate `.moc3`, `.model3.json`, or other Cubism-compatible files.

## 2. Users and final workflows

### Human operator

A human opens the Studio app, loads an avatar, and controls it using UI
controls, keyboard shortcuts, pointer gaze, microphone level, or an optional
tracking adapter. The operator can record, replay, and export command sequences.

### AI application

An AI application imports the runtime package or sends validated commands
through an adapter. It can request semantic states such as `happy`, `thinking`,
`wave`, or a gaze target without knowing model-specific parameter names.

### Avatar author

An author prepares licensed layer art, rigs it, previews parameter ranges,
validates rights and bundle integrity, and exports a deterministic bundle.

### Application developer

A developer embeds a canvas or web component, loads a bundle, subscribes to
runtime events, and supplies commands from any control source.

## 3. Product boundaries

This repository owns:

- the open bundle format and JSON Schema;
- runtime, animation mixer, renderer, SDK, and control protocol;
- human controller/preview Studio;
- authoring/export/validation tools;
- original reference avatar and its rights records;
- tests, examples, documentation, and release artifacts.

Host applications own:

- conversation, agent, and user state;
- microphone permission and audio capture;
- camera/tracking permission and raw tracking data;
- AI prompts, provider events, credentials, and tool calls;
- authorization for remote control.

Avatar bundles must never contain executable code, secrets, raw provider
events, or application state.

## 4. Architecture principles

1. **One control contract.** Humans and AI use the same semantic command types.
2. **Deterministic core.** Given a bundle, command stream, clock, and seed, the
   pose result is reproducible.
3. **Dependency direction.** Apps depend on public packages; core packages
   never import from apps.
4. **Ports and adapters.** Keyboard, UI, AI, audio, and tracking are adapters
   around the control API, not renderer features.
5. **Capability discovery.** A controller queries supported capabilities before
   sending commands and receives a graceful unsupported result.
6. **Safe data boundary.** Schema validation, limits, path normalization, and
   integrity checks happen before GPU allocation.
7. **Lifecycle ownership.** Every created texture, buffer, listener, and audio
   node has an explicit dispose path.
8. **Accessibility and reduced motion.** Human controls are keyboard accessible;
   consumers can disable physics, idle motion, and flashes.
9. **Versioned public APIs.** Packages, protocol, schema, and bundles follow
   semantic versioning independently.
10. **No premature editor.** Prove the runtime and file format before building a
    full visual rig editor.
11. **CI/CD grows with every phase.** A phase is incomplete until its new
    requirements run automatically. Deployment publishes only the safe preview,
    report, package, or release artifact appropriate to that phase.

## 5. System design

```text
Human UI / keyboard / tracking / microphone      AI / scripts / host app
                    |                                      |
                    +---------- control adapters ----------+
                                           |
                                  validated commands
                                           |
                              control router + policy
                                           |
                           scheduler / animation state machine
                                           |
                  parameter mixer (base + motion + expression + live input)
                                           |
                               deformer / pose evaluator
                                           |
                                  PixiJS renderer
                                           |
                                         canvas
```

### Runtime layers

- **Bundle loader:** parses, validates, resolves, and verifies assets.
- **Capability registry:** reports expressions, motions, parameters, and input
  channels available in the loaded avatar.
- **Control router:** validates commands, applies source priority, rate limits,
  cancellation, and ownership rules.
- **Scheduler:** timestamps commands and manages queues, interruption, and
  cross-fades.
- **Parameter mixer:** combines layers in a fixed order:
  defaults -> idle/physics -> motion -> expression -> gaze/tracking -> lip sync
  -> safety clamp.
- **Pose evaluator:** evaluates keyframes, interpolation, pivots, and mesh
  deformation without renderer-specific application logic.
- **Renderer:** owns PixiJS resources and renders the evaluated pose.

Production uses WebGL initially. WebGPU remains an experimental path until
browser behavior and visual parity pass the release suite.

## 6. Public control contract

All sources submit an envelope; source identity is supplied by the trusted host,
not accepted from an untrusted AI payload.

```ts
type AvatarCommand =
  | { type: "expression.set"; id: string; intensity?: number; fadeMs?: number }
  | { type: "motion.play"; id: string; priority?: number; fadeMs?: number }
  | { type: "motion.stop"; id?: string; fadeMs?: number }
  | { type: "gaze.set"; x: number; y: number; durationMs?: number }
  | {
      type: "pose.set";
      parameters: Record<string, number>;
      durationMs?: number;
    }
  | { type: "lipSync.set"; mouthOpen: number }
  | { type: "viseme.set"; id: string; weight: number; durationMs?: number }
  | { type: "state.reset"; fadeMs?: number };

type CommandEnvelope = {
  protocol: "open-avatar-control";
  version: "1.0";
  requestId: string;
  timestamp: number;
  command: AvatarCommand;
};
```

The SDK returns an acknowledged result with `accepted`, `completed`,
`interrupted`, `unsupported`, `invalid`, or `rate_limited`. Continuous channels
such as gaze and mouth level are coalesced instead of queued.

### Control arbitration

- Emergency reset and host policy have highest priority.
- Explicit human input wins over AI input for a configurable hold period.
- Lip sync owns only mouth/viseme parameters.
- Gaze/tracking owns only declared gaze/head channels.
- A motion cannot write undeclared targets.
- Commands have bounds, maximum duration, and rate limits.
- Remote control is opt-in and belongs in the host adapter, not the core runtime.

## 7. Open Avatar bundle contract

```text
avatar-bundle/
|-- avatar.json
|-- textures/
|-- meshes/
|-- animations/
|-- thumbnails/
|-- LICENSES/
|   |-- rights.json
|   `-- notices.txt
`-- checksums.sha256
```

`avatar.json` contains:

- format and bundle version;
- canvas and coordinate system;
- resource limits and texture references;
- parts, draw order, masks, pivots, and meshes;
- typed parameter definitions with defaults and ranges;
- expressions, motions, and transitions;
- semantic capability mappings;
- lip-sync and optional viseme mappings;
- accessibility metadata and reduced-motion behavior;
- rights-manifest reference.

The canonical schema is JSON Schema Draft 2020-12. Unknown major versions are
rejected; unknown optional fields are preserved where safe. Paths must be
relative, normalized, inside the bundle, and referenced files must match their
hashes.

## 8. Target repository structure

Use a pnpm TypeScript workspace with explicit `workspace:` dependencies.

```text
live2d-model/
|-- .changeset/                 # package release notes and versioning
|-- .github/
|   `-- workflows/              # CI, security, release
|-- apps/
|   |-- studio/                 # human controller and authoring preview
|   `-- playground/             # minimal SDK integration example
|-- packages/
|   |-- schema/                 # manifest/control schemas and generated types
|   |-- core/                   # clock, math, scheduler, mixer, pose evaluation
|   |-- runtime/                # public high-level AvatarRuntime API
|   |-- renderer-pixi/          # PixiJS resource and rendering adapter
|   |-- controls/               # router, policy, human/AI input adapters
|   |-- audio/                  # RMS and optional viseme input adapters
|   |-- validator/              # safe bundle validation and diagnostics
|   |-- exporter/               # deterministic bundle creation
|   `-- web-component/          # framework-neutral browser embedding
|-- assets/
|   |-- source/                 # original editable art; never runtime-loaded
|   |-- reference-avatar/       # source definition for the first-party avatar
|   `-- fixtures/               # small valid/malformed test bundles
|-- docs/
|   |-- adr/                    # architecture decision records
|   |-- architecture/
|   |-- authoring/
|   |-- protocol/
|   |-- security/
|   `-- tutorials/
|-- examples/
|   |-- ai-controller/
|   `-- human-controller/
|-- tests/
|   |-- e2e/
|   |-- golden/
|   |-- performance/
|   `-- soak/
|-- tools/                      # repository-only scripts and build helpers
|-- AGENTS.md                   # contributor/agent instructions
|-- LICENSE
|-- README.md
|-- SECURITY.md
|-- package.json
|-- pnpm-lock.yaml
|-- pnpm-workspace.yaml
|-- tsconfig.base.json
`-- vitest.workspace.ts
```

Rules:

- Each package has `src/`, `test/`, `package.json`, `tsconfig.json`, and a
  documented public entry point.
- Import through package entry points; do not deep-import another package's
  `src`.
- Keep generated files identifiable and reproducible.
- Keep test fixtures out of published packages unless explicitly required.
- Store large binary source art with Git LFS once binary artwork is introduced.
- Never commit credentials, local recordings, camera captures, build output,
  dependency folders, or unsigned release archives.

## 9. Initial semantic capabilities

- Expressions: `neutral`, `happy`, `sad`, `angry`, `surprised`, `thinking`.
- Motions: `idle`, `nod`, `wave`, `explain`, `shrug`.
- Gaze: normalized X/Y in `[-1, 1]`.
- Lip level: normalized mouth-open in `[0, 1]`.
- Blink: automatic plus explicit override.
- Pose: bounded semantic head/body parameters.
- Optional visemes: documented symbol set and phoneme mapping.

Model-specific parameter and layer names remain internal. Semantic mappings are
declared by each bundle.

## 10. Delivery phases and gates

### Phase 0 - Foundation and decisions

- [ ] Approve this product scope and repository structure.
- [ ] Create ADR template and decision log.
- [ ] Compare the custom PixiJS format/runtime with eligible open alternatives.
- [ ] Decide browser baseline, package manager version, license, and release
      policy.
- [ ] Scaffold the workspace, linting, formatting, tests, and CI.
- [ ] Add CI for document policy, secret scanning, install, lint, type-check,
      unit tests, and build; add a manual dry-run artifact packaging job.

Gate: ADR records the chosen format/runtime; the empty workspace passes CI and
the dry-run artifact contains no secret or ignored file.

### Phase A - Rights, requirements, and visual specification

- [x] Create a machine-readable rights manifest for every image, font, and
      reference.
- [x] Approve an original character sheet, turnaround, front pose, palette,
      proportions, safe areas, and layer breakdown.
- [x] Set target canvas, texture, bundle-size, and memory budgets.
- [x] Decide RMS-only or the languages/viseme set required for v1.
- [x] Approve expression, motion, and accessibility acceptance checklists.
- [x] Extend CI with rights-manifest and specification completeness checks;
      publish the review report as a non-release artifact.

Gate: rights records are complete, all art is original or redistributable, and
the character/layer specification is approved. Phase A CI passes.

### Phase B - Vertical runtime spike

- [ ] Load a minimal schema-valid bundle.
- [ ] Render a layered head/torso and one deformable mesh.
- [ ] Demonstrate human UI and scripted/AI commands through the same API.
- [ ] Demonstrate gaze, blink, mouth-open, interruption, reset, and disposal.
- [ ] Record frame time, memory, bundle size, context loss, and remount results.
- [ ] Extend CI with schema fixtures, browser smoke tests, lifecycle checks, and
      performance reporting; deploy an approval-gated preview.

Gate: stable 60 FPS on the named reference device; no lifecycle leaks; control
contract and format can represent all required capabilities.
The preview must be reproducible from the tested commit.

### Phase C - Runtime MVP

- [x] Implement schema, validator, loader, scheduler, mixer, pose evaluator,
      renderer, and runtime SDK.
- [x] Implement command acknowledgements, cancellation, arbitration, capability
      discovery, limits, and diagnostics.
- [x] Implement context loss, resize, device-pixel ratio, reduced motion, and
      cleanup.
- [x] Extend CI with contract, malformed-input, browser-matrix, coverage, and
      package-pack checks.

Gate: public API contract tests and malformed-input security tests pass.
Packed packages must install in a clean consumer fixture.

### Phase D - First-party avatar and animation

- [ ] Produce separated artwork and approved meshes.
- [x] Rig head/body pose, eyes, blink, brows, and mouth; optional physics is
      intentionally deferred for the lightweight first-party fixture.
- [x] Author all required semantic expressions and motions as deterministic
      first-party clips.
- [x] Add interruption, cross-fade, and private RMS/optional viseme processing;
      live mouth input remains isolated from unrelated parameters.
- [x] Extend CI with rights checks, interruption coverage, and deterministic
      parameter sweeps for the authored clips.
- [ ] Add golden renders and first-party asset budgets; publish a validated
      avatar artifact from approved source inputs. Automated source validation
      and enforced fixture-size budgets are in place, as is a reviewed Chromium
      fixture-render baseline; per-clip visual baselines and the approved
      release artifact remain pending.

Gate: parameter sweeps do not tear; repeated interruptions return to a stable
idle pose; live channels never overwrite unrelated parameters.
The bundle must be generated from validated source inputs.

Current status: runtime animation, clip authoring, Studio integration,
parameter-sweep CI, and the first-party fixture rig are implemented. The Phase
D gate remains pending separated approved artwork, golden-render evidence,
asset budgets, and a validated first-party bundle.

### Phase E - Human Studio and authoring tools

- [ ] Build accessible control panels, keyboard mappings, pointer gaze, audio
      meter, command timeline, capability inspector, and diagnostics.
- [ ] Add deterministic exporter, rights editor, validation report, and bundle
      preview.
- [ ] Support recording/replaying the provider-neutral command stream.
- [ ] Extend CI with Studio unit, end-to-end, accessibility, exporter
      reproducibility, and preview smoke tests.

Gate: a human can load, inspect, control, validate, and export the avatar
without editing source code.
The tested Studio preview must match the deployed commit.

### Phase F - AI and host integration

- [ ] Publish a minimal AI-controller example with allowlisted semantic cues.
- [ ] Publish framework-neutral runtime and web component examples.
- [ ] Add adapter guidance for agent, TTS, viseme, and streaming-audio hosts.
- [ ] Verify that removing or rejecting a bundle falls back safely.
- [ ] Extend CI with example-consumer, web-component, concurrent-controller,
      fallback, and integration tests.

Gate: both example controllers drive the same runtime concurrently, human
override works, and no provider-specific type enters a core package.
Every published example records its source commit and package versions.

### Phase G - Hardening and release

- [ ] Complete unit, integration, browser, visual regression, accessibility,
      performance, context-loss, 30-minute soak, and supply-chain checks.
- [ ] Publish migration rules, API docs, bundle authoring guide, checksums,
      license metadata, SBOM, and signed artifacts.
- [ ] Version packages, protocol, format, and avatar bundle independently.
- [ ] Require approval-gated release jobs with provenance, SBOM, checksums,
      signatures, clean-install verification, and post-publish smoke tests.

Gate: all release budgets pass on supported browsers and a clean consumer
project can install, load, control, dispose, and reload the avatar.

## 10.1 CI/CD policy

- Pull requests run all checks accumulated through the current phase.
- Branch protection requires relevant checks; unreviewed commits cannot publish.
- Workflows use minimum permissions; ordinary CI has read-only repository access
  and no deployment secrets.
- Installation uses the committed lockfile and avoids unapproved lifecycle
  scripts where practical.
- Caches never contain environment files, tokens, recordings, or signing keys.
- Preview artifacts are immutable and labeled with the full Git commit.
- Forked or untrusted changes never receive protected environment secrets.
- CD uses approval-protected GitHub environments and scoped credentials.
- Production releases are tag-triggered, reproducible, checksummed, signed, and
  followed by clean-consumer smoke tests.
- Rollback selects a previous immutable artifact; versions are never overwritten.

## 11. Quality budgets

Exact numbers are approved during Phase A; initial targets:

- 60 FPS on the named reference development device.
- P95 main-thread frame work below 12 ms at 1x DPR.
- No unbounded allocations during idle or continuous control.
- No retained renderer resources after repeated mount/dispose cycles.
- First-party compressed runtime bundle target below 5 MB, excluding source art.
- Texture dimensions and total decoded GPU memory have hard validator limits.
- A command is acknowledged within one animation frame.
- Identical exporter inputs produce byte-identical manifests and stable hashes.

## 12. Test strategy

- Unit tests for math, interpolation, mixing, scheduling, and path handling.
- Contract tests shared by all controller adapters.
- Schema tests with valid, boundary, malformed, and adversarial fixtures.
- Golden screenshots for expressions, motions, and cross-fades.
- Browser tests for resize, high DPR, context loss, reduced motion, and disposal.
- Fuzz/property tests for parameter bounds, mesh indices, and command sequences.
- Performance and 30-minute CPU/GPU memory soak tests.
- End-to-end tests for human override of AI and stable return to idle.
- Export reproducibility and rights-manifest completeness tests.

## 13. Security and privacy

- Treat bundles and AI commands as untrusted data.
- No dynamic evaluation, bundle scripts, external URLs, or absolute paths.
- Enforce maximum archive size, expanded size, files, textures, vertices,
  keyframes, command rate, and duration.
- Prevent ZIP bombs, traversal, invalid indices, NaN/Infinity, and GPU
  over-allocation.
- Keep microphone/camera processing local by default and outside the runtime.
- Require explicit host authorization for network or remote controllers.
- Redact user content from diagnostics and telemetry; telemetry is opt-in.

## 14. Versioning and compatibility

- Start public packages and schemas at `0.1.0`.
- Declare the public API and use semantic versioning.
- Include protocol and bundle versions in data, not only package versions.
- Add a migration path before changing a stable manifest or command contract.
- Reject unknown major versions and tolerate documented optional additions.
- Maintain fixtures for every supported bundle/protocol version.

## 15. Explicit non-goals for v1

- Cubism reverse engineering or compatible output.
- A general-purpose illustration editor.
- Server-side rendering of the avatar.
- Built-in AI, LLM, speech, camera, or identity provider.
- Executable plugins inside avatar bundles.
- Unrestricted AI access to raw model parameters.
- Full-body motion capture or photorealistic rendering.

## 16. First deliverable

Before full artwork or rigging, deliver:

1. approved Phase A rights and visual-spec documents;
2. an ADR choosing the format/runtime;
3. a browser spike with an original layered head, eye focus, blinking, and
   mouth-open;
4. one human control panel and one scripted controller using the same API;
5. recorded performance and lifecycle results.

No full character rig begins until the rights checklist and runtime ADR pass.
