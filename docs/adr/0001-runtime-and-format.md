# ADR 0001: Runtime and avatar format

- Status: Accepted; amended for dual output
- Date: 2026-07-31
- Decision owners: project maintainers
- Scope: browser renderer, runtime boundary, and distributable avatar format

## Context

Open 2D Avatar needs to render layered and deformable characters in modern
browsers while allowing humans, scripts, tracking adapters, and AI applications
to use one semantic control contract. The default runtime and export must not
depend on Live2D Cubism Core, its SDK, editor, or file formats. An optional
Cubism-ready PSD handoff may depend on a user-installed Cubism Editor without
changing the Open Avatar runtime boundary. It must also be possible to validate
untrusted bundles before GPU allocation, export bundles deterministically,
audit asset rights, and evolve the renderer without changing the public control
protocol.

This ADR compares a custom runtime built on PixiJS with open, non-Cubism
alternatives that are close enough to merit evaluation. "Open" here means that
the runtime source and redistribution license are available; it does not imply
that every authoring tool or hosted service is open source or free.

## Decision drivers

1. Browser-first rendering with TypeScript integration.
2. Direct, bounded control of gaze, blink, mouth, pose, expressions, and motion.
3. A provider-neutral semantic API independent of UI and AI vendors.
4. A documented, inspectable format that this repository can validate and
   export without a required hosted editor.
5. Safe redistribution of the runtime and first-party bundles.
6. Deterministic scheduling, animation mixing, export, and test clocks.
7. Explicit GPU lifecycle, context recovery, and resource limits.
8. Sustainable maintenance and a practical fallback policy.

## Options considered

### Comparison

| Option                                                      | License and redistribution                                                                                                                                                                                   | Browser and TypeScript                                                                                                                                                                                                                                                | Runtime control                                                                                                                                                                                                                                        | Format and export                                                                                                                                                                                                                                                                                                                                 | Maintenance evidence                                                                                                                                                                                               | Fit                                                                                                                                                                                                                    |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Custom Open Avatar runtime and format, rendered by PixiJS 8 | PixiJS is MIT licensed and permits use, modification, distribution, sublicensing, and sale when its notice is retained. The project can choose its own license for original runtime code and bundle schemas. | PixiJS is predominantly TypeScript and supports browsers and Web Workers. Its v8 mesh API exposes geometry, UVs, indices, shaders, and WebGL/WebGPU state.                                                                                                            | The project owns the scheduler, mixer, parameter clamps, deterministic clock, capability map, and disposal contract. Pixi consumes evaluated poses only, so semantic commands do not leak into rendering.                                              | The project owns a versioned JSON manifest, external textures/meshes/animations, rights records, checksums, validator, and deterministic exporter. PixiJS itself is a renderer, not an avatar format or authoring system.                                                                                                                         | The official repository shows active releases, including v8.18.1 in April 2026, and extensive TypeScript development. This reduces renderer risk but leaves avatar-runtime maintenance with this project.          | Best match for control, validation, export, and ownership requirements; highest implementation cost.                                                                                                                   |
| Rive Web runtime and `.riv`                                 | Official runtimes are open source under MIT. That statement applies to the runtimes, not automatically to the editor, hosted service, or user-created art.                                                   | The official Web runtime is JavaScript/TypeScript plus WASM, accepts a canvas or offscreen canvas, and offers high- and low-level APIs.                                                                                                                               | State machines, number/boolean/trigger inputs, and newer data-bound view-model properties provide capable application control. State-machine internals are intentionally controlled indirectly, which limits ownership of scheduling/mixing semantics. | `.riv` is a documented binary runtime format. Runtime export is performed by the Rive editor, and current official documentation says runtime export is available on paid plans. This introduces an external authoring/export dependency and makes the repository's required deterministic exporter and JSON-first validation path harder to own. | The official Web repository has thousands of commits and recent 2026 activity.                                                                                                                                     | Strong renderer/animation product, but rejected as the canonical format/runtime because control, export, and authoring ownership would shift outside the project. A future import adapter may be evaluated separately. |
| Inochi2D SDK and INP format                                 | The official SDK is BSD-2-Clause, which permits redistribution with notice and disclaimer retention.                                                                                                         | The official SDK is written in D and documents native/static, dynamic C FFI, and Godot builds. Its official materials do not establish a supported browser TypeScript runtime, so a WASM/JS bridge and browser GPU layer would become project-owned integration work. | It is purpose-built for puppets and has an established model concept, but adopting it would couple the runtime to Inochi parameter/model semantics or require a translation layer below the provider-neutral API.                                      | INP is an established binary puppet container. Adopting it would constrain the project's JSON Schema, pre-allocation validation, deterministic exporter, and explicit rights/checksum layout, or require a second outer bundle.                                                                                                                   | The official SDK's latest listed release is v0.8.7 from October 2024. Its native ecosystem is meaningful, but the browser integration needed here is not evidenced as a maintained official target.                | Eligible open puppet technology, rejected for v1 due to browser/TypeScript and format-boundary mismatch.                                                                                                               |
| DragonBonesJS and DragonBones data                          | DragonBonesJS is MIT licensed.                                                                                                                                                                               | The official repository describes a JavaScript/TypeScript runtime with PixiJS and other engine integrations.                                                                                                                                                          | Bone animation and runtime playback are available, but the abstraction is skeletal animation rather than the complete semantic control, arbitration, live-channel mixing, validation, and lifecycle system required here.                              | Existing DragonBones data/export workflows could be adapted, but they do not provide the project's proposed rights manifest, checksums, semantic capability schema, or deterministic Open Avatar exporter as one owned contract.                                                                                                                  | The repository lists only three releases and identifies v3.0.1 from January 2015 as the latest release, despite later repository activity. That release signal and fragmented editor history create adoption risk. | Rejected as the foundation. It may be useful as prior art for skeletal data and Pixi integration.                                                                                                                      |

Spine is not eligible because its official runtimes and editor use a commercial
license rather than an open runtime license. Live2D Cubism is excluded as the
default runtime but is supported as an optional authoring handoff. Lottie is
not evaluated as a puppet runtime because its core contract is authored
animation playback, not continuous deformable avatar control.

## Decision

Adopt an **Open Avatar-owned runtime and bundle format**, with **PixiJS 8 as the
initial rendering adapter**. Open Avatar is the default automated rig, preview,
and export. The product also supports an optional Cubism-ready PSD export.

The format is not a serialized Pixi scene. It is renderer-neutral application
data:

- a versioned JSON manifest governed by JSON Schema Draft 2020-12;
- relative references to textures, meshes, animations, thumbnails, and rights
  records;
- typed parameter definitions and semantic capability mappings;
- declared write sets for motions and live channels;
- normalized, bounded values and finite numeric data only;
- per-file checksums and hard resource limits;
- no scripts, dynamic evaluation, absolute paths, or external URLs.

The core runtime parses validated bundle data into renderer-neutral structures.
It owns the deterministic clock, command router, scheduler, interruption,
cross-fades, animation layers, clamps, and pose evaluation. The Pixi adapter
receives an evaluated pose and owns scene objects, textures, meshes, masks,
buffers, rendering, resize, context recovery, and disposal. It must not import
from applications or accept human/AI command envelopes directly.

The public control protocol remains provider-neutral. Rive, Inochi2D, a future
renderer, and any authoring UI may only integrate through adapters; none may
introduce their parameter names, state-machine inputs, or file-format concepts
into semantic command types.

### Cubism handoff boundary

The generated project may export aligned, named, grouped PSD source art for
manual or assisted import into Live2D Cubism Editor. This exporter is an
authoring adapter and must not make packages depend on Cubism Core or accept
Cubism types in the Open Avatar control protocol.

A PSD is labelled **Cubism-ready**, not a Live2D model. Official Cubism
documentation states that PSD import creates ArtMeshes and that parameter-linked
vertex movement is stored in the `.moc3` exported by Modeler. Only data imported,
rigged or verified, and exported through an approved Cubism Editor version may
be labelled a Live2D Cubism model. Automated `.cmo3` or `.moc3` creation is not
approved.

### Production renderer and fallback policy

Use PixiJS **WebGL/WebGL2 in production**. PixiJS currently labels its WebGL
renderer stable and recommended, labels WebGPU experimental/still maturing, and
states that its Canvas renderer is coming soon. Therefore:

1. request WebGL explicitly rather than depending on automatic backend choice;
2. treat WebGPU as opt-in experimental work until browser parity, masks,
   meshes, context loss, screenshots, and performance pass the same suite;
3. on transient WebGL context loss, pause advancement, preserve logical runtime
   state, rebuild GPU resources after restoration, and resume safely;
4. when WebGL is unavailable or restoration repeatedly fails, show an
   accessible static poster/placeholder plus a structured `renderer_unavailable`
   diagnostic;
5. do not silently substitute an unverified Canvas2D renderer, reduce validation
   limits, or alter semantic command behavior;
6. keep the renderer interface replaceable so a tested Canvas2D or other backend
   can be added later without changing bundle semantics or the control API.

This is graceful product fallback, not visual-equivalence fallback. Host
applications can continue to inspect capabilities and receive deterministic
unsupported/unavailable results even when animated rendering is unavailable.

## Consequences

### Positive

- Human and AI controllers share one contract and arbitration policy.
- Bundle safety and rights checks occur before renderer allocation.
- Export and validation remain local, inspectable, testable, and deterministic.
- Renderer replacement does not require a protocol or bundle-format rewrite.
- PixiJS supplies mature browser GPU primitives without imposing an avatar
  authoring format.
- Original model data is not locked to an editor subscription or hosted
  service.
- Users who need the Cubism ecosystem have an explicit optional handoff without
  making it the default runtime.

### Negative

- The project must implement and maintain deformation, animation mixing,
  authoring/export tools, schemas, migrations, and diagnostics.
- A custom format begins without the ecosystem or editor maturity of Rive or
  Inochi2D.
- JSON and separate resources can be larger or slower to parse than a compact
  binary until packaging and loading are optimized.
- WebGL-only production support needs an explicit non-animated fallback on
  devices where WebGL is unavailable.
- PixiJS upgrades can affect shader, mesh, mask, texture, and lifecycle behavior
  and therefore require pinned versions and regression testing.
- The optional Cubism path requires a separately installed and appropriately
  licensed editor, plus human rig review.

## Vertical spike proofs and risks

The Phase B spike must resolve these risks before this ADR can become Accepted:

1. **Mesh correctness:** one deformable textured mesh must preserve UVs and
   avoid seams or tearing throughout all declared parameter extremes.
2. **Layer composition:** draw order, pivots, alpha, clipping/masks, and
   overlapping transparent layers must match golden images.
3. **Control isolation:** gaze, blink, and mouth-open must write only their
   declared channels; human and scripted control must use the same API.
4. **Determinism:** identical bundle, command stream, seed, and fake-clock ticks
   must produce identical evaluated poses without relying on Pixi's ticker.
5. **Interruption:** expression/motion cross-fades, cancellation, reset, and
   rapid human override must return to a stable neutral/idle state.
6. **Lifecycle:** repeated load, mount, resize, dispose, and reload cycles must
   release textures, buffers, listeners, tickers, and object URLs without
   retained growth.
7. **Context recovery:** forced WebGL loss/restoration must not duplicate
   resources, lose logical pose state, or leave the command API hanging.
8. **Performance:** layered art plus at least one mesh must meet the approved
   60 FPS/frame-time and GPU-memory budgets on the named reference device at
   the approved device-pixel ratio.
9. **Validation boundary:** malformed indices, excessive vertices/textures,
   non-finite values, traversal paths, unknown major versions, and checksum
   failures must be rejected before GPU allocation.
10. **Bundle viability:** the minimal bundle and exporter prototype must prove
    canonical ordering, stable numeric serialization, stable checksums, and
    adequate representation of required semantic capabilities.
11. **Backend isolation:** core and schema packages must have no Pixi imports,
    and the renderer must consume evaluated pose data rather than commands.
12. **Fallback UX:** WebGL-unavailable and permanently lost-context cases must
    produce an accessible placeholder and actionable structured diagnostic.
13. **Dependency footprint:** record renderer JavaScript size, loaded texture
    bytes, decoded GPU estimates, and startup time so Phase A can set realistic
    limits.
14. **Security behavior:** no bundle content may cause network access, code
    execution, shader injection, or allocation outside validated limits.

If the spike fails mesh correctness, lifecycle, or performance gates, revisit a
Rive adapter/prototype and a focused Inochi2D browser feasibility study before
expanding the custom runtime.

## Evidence

Primary and official sources accessed 2026-07-29:

- [PixiJS repository and MIT license](https://github.com/pixijs/pixijs)
- [PixiJS renderer guidance](https://pixijs.com/8.x/guides/components/renderers)
- [PixiJS Mesh guide](https://pixijs.com/8.x/guides/components/scene-objects/mesh)
- [PixiJS environment support](https://pixijs.com/8.x/guides/concepts/environments)
- [Rive runtime overview and licensing](https://rive.app/docs/runtimes/getting-started)
- [Rive Web runtime repository](https://github.com/rive-app/rive-wasm)
- [Rive state-machine playback](https://rive.app/docs/runtimes/state-machines)
- [Rive Web data binding](https://rive.app/docs/runtimes/web/data-binding)
- [Rive runtime format](https://rive.app/docs/runtimes/advanced-topic/format)
- [Rive runtime export](https://rive.app/docs/editor/exporting/exporting-for-runtime)
- [Inochi2D official SDK repository](https://github.com/Inochi2D/inochi2d)
- [Inochi2D technical documentation](https://docs.inochi2d.com/)
- [DragonBonesJS official repository](https://github.com/DragonBones/DragonBonesJS)
- [Live2D Cubism PSD import](https://docs.live2d.com/en/cubism-editor-manual/psd-import/)
- [Live2D Cubism model files](https://docs.live2d.com/en/cubism-sdk-manual/model-web/)

Repository activity and release dates are evidence of current project activity,
not a guarantee of future maintenance. Dependency versions and licenses must be
rechecked and recorded in the lockfile/SBOM before each release.
