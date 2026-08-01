# Open 2D Avatar Threat Model

- Status: Proposed
- Applies to: generation providers, project/bundle loader, runtime, renderer,
  control adapters, Studio, exporter, examples, and host integration
- Trust posture: prompts, workflows, generated artifacts, avatar projects and
  bundles, remote commands, and media inputs are untrusted

## Security goals

The system must load data and accept controls without executing bundle code,
escaping the bundle boundary, exhausting host resources, impersonating a
trusted controller, or capturing and disclosing user media. A malformed input
must fail closed with a bounded, non-sensitive diagnostic and leave allocated
resources disposable.

Protecting a compromised host page, browser, operating system, or dependency is
outside the v1 runtime boundary. Host applications remain responsible for user
authentication, network security, credential storage, consent records, and
authorization of controllers.

## Trust boundaries

### Avatar bundle boundary

A bundle is data, never an application. Manifests, archives, textures, meshes,
animations, rights records, filenames, and metadata are untrusted until
validated. A bundle may not contain or cause execution of JavaScript, shaders,
WebAssembly, HTML, or plugins. It may not use absolute paths, parent traversal,
device paths, symbolic-link escapes, external URLs, data URLs, or network
fetches. References must be normalized relative paths inside the bundle and
must match declared checksums before GPU allocation.

Schema validity is necessary but not sufficient. The loader also verifies
archive structure, media signatures/decoding, finite numeric values, array and
index bounds, mesh topology, declared capability targets, and resource totals.
Unknown major format versions are rejected. Unknown optional fields are ignored
or preserved only when doing so cannot activate behavior.

Bundle signatures may establish provenance in a future release; absence of a
signature in v1 must never be presented as proof that a bundle is safe.

### Generation-provider boundary

Studio may connect to an explicitly configured local ComfyUI endpoint through a
development or installed-app bridge. It must not discover arbitrary network
hosts or accept a provider URL from an uploaded project. Production deployment
must not expose an unrestricted reverse proxy to a user's local network.

The repository owns reviewed workflow templates. Prompt text and bounded
settings may fill allowlisted template inputs, but may not select node classes,
paths, URLs, commands, output directories, or arbitrary checkpoints. Uploaded
projects and image metadata never supply executable workflows. Provider
capabilities and checkpoint identifiers are discovered separately, shown to the
user, and matched against a local allowlist with rights evidence.

Provider jobs have a single active-job limit on the reference device, a bounded
queue, timeout, cancellation, and cleanup. Returned artifacts are untrusted
until their status, count, encoded bytes, decoded MIME signature, dimensions,
pixel count, alpha requirements, and hashes pass validation. Provider errors
and provenance records must not copy complete prompts, local paths, credentials,
or image content into logs.

Cloud generation is not part of the approved P1 boundary. A future cloud
adapter requires explicit consent, credential storage outside exported projects
and browser bundles, destination and retention disclosure, cost controls, and a
separate threat review.

### Command boundary

AI-produced, scripted, cross-window, network, and remote commands are untrusted
payloads. They pass through the same versioned schema, semantic capability
allowlist, numeric clamps, duration limits, rate limits, coalescing rules, and
state machine as local human commands. Commands cannot name internal layers,
GPU resources, filesystem paths, URLs, code, credentials, or arbitrary model
parameters.

Identity, role, priority, and source class are attached by a trusted host
adapter after authentication. Values claiming to be `human`, `admin`, local,
or high priority inside a payload are ignored. Explicit local human input and
emergency reset override AI control for the host-configured hold period.

Continuous input such as gaze and mouth-open is last-value coalesced rather
than queued. Discrete commands have bounded queues, lifetimes, repetition, and
transition duration. Rejection and throttling do not echo the complete hostile
payload into logs.

### Remote-control boundary

The core runtime does not listen on a network interface. Remote control is
opt-in and implemented by the host. The host must authenticate the controller,
authorize it for a specific avatar/session and capability subset, bind source
identity server-side, expire sessions, support immediate revocation, and use
transport confidentiality and origin protections appropriate to the transport.

Pairing secrets and API credentials never enter commands, bundles, URLs, client
logs, or avatar diagnostics. Cross-origin window messaging requires an exact
origin allowlist and a dedicated channel/session identifier; wildcard origins
are forbidden. Connection alone does not grant microphone, camera, raw pose,
authoring, export, or filesystem rights.

## Threats and required controls

| Threat                               | v1 required control                                                                                                                                                                   |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Archive bomb or oversized expansion  | Stream/count entries where possible; reject before full expansion; enforce compressed and expanded byte limits and compression-ratio limits.                                          |
| Path traversal or overwrite          | Normalize and validate every path; reject absolute, parent, reserved-device, duplicate/case-collision, link, and outside-root targets; extraction uses a private temporary directory. |
| Malformed image or GPU exhaustion    | Decode through maintained browser APIs; verify dimensions and aggregate decoded/GPU estimates before texture creation; cap texture count and dimensions.                              |
| Invalid mesh/index data              | Require finite values, bounded vertex/index counts, legal indices, declared attributes, and bounded coordinates before buffer allocation.                                             |
| Animation complexity attack          | Cap parameters, motions, keyframes, duration, nesting, masks, and work evaluated per frame; reject non-finite time/value data.                                                        |
| Command flood or starvation          | Per-source and global rate/burst/queue limits; coalesce continuous channels; expiry, cancellation, fair scheduling, and human/emergency priority.                                     |
| Capability or priority escalation    | Host-attached identity and policy; semantic capability allowlists; ignore payload identity/priority claims; never expose unrestricted parameter writes to AI.                         |
| Persistent nuisance motion           | Maximum durations, reset/stop action, human override, reduced-motion clamp, and safe neutral state after disconnect.                                                                  |
| Media surveillance                   | Explicit browser permission plus in-product active indicator and stop action; local processing by default; no automatic capture on bundle load.                                       |
| Data leakage through logs/telemetry  | Structured error codes, payload redaction, no raw media or transcripts, telemetry off by default, bounded retention controlled by the host.                                           |
| Malicious external asset fetch       | No external URLs in bundles; host supplies bytes through an explicit loader and its own fetch/CSP policy.                                                                             |
| Resource leak after failure          | Transactional load; dispose all temporary CPU/GPU/audio/listener resources on success, rejection, cancellation, context loss, and remount.                                            |
| Prompt-controlled workflow execution | Insert text only into reviewed template fields; allowlist node classes and setting ranges; prompts cannot select paths, URLs, checkpoints, nodes, or commands.                        |
| Hostile generated artifact           | Enforce response status, count, bytes, MIME signature, dimensions, pixels, alpha policy, hashes, and decode timeout before project use.                                               |
| Local-provider pivot or CSRF         | Fixed loopback target, same-origin bridge, origin checks where supported, no project-defined endpoint, and no unrestricted production reverse proxy.                                  |
| Checkpoint or output rights failure  | Explicit user selection plus evidence-backed model/output rights record; unknown or incompatible rights block project export.                                                         |
| Stuck or abandoned generation job    | One active job, bounded timeout and polling, abort signal, provider cancellation, idempotent cleanup, and no accepted revision until completion.                                      |

## Resource-limit categories

Validators and routers must enforce hard limits before costly allocation when
possible. Limit categories required for v1 are:

- archive: compressed bytes, expanded bytes, entry count, path length,
  per-entry bytes, compression ratio, and nesting;
- manifest: input bytes, parse depth, object/array/string sizes, and referenced
  resource count;
- textures: count, width/height, pixels, decoded CPU bytes, estimated GPU bytes,
  atlas count, and masks;
- geometry: parts, meshes, vertices, indices, attributes, coordinate magnitude,
  and deformers;
- animation: parameters, expressions, motions, tracks, keyframes, duration,
  transitions, interpolation complexity, and simultaneous active motions;
- runtime: total CPU/GPU memory estimate, canvas size, DPR, frame work,
  listeners, audio nodes, and concurrently loaded avatars;
- commands: envelope bytes, string lengths, parameter count, numeric ranges,
  per-source/global rate and burst, queue depth, duration, and expiry;
- diagnostics: message length, event frequency, retained history, and export
  size.
- generation: prompt bytes, template fields, active jobs, queue depth, timeout,
  polling interval, input/output count, encoded bytes, image dimensions and
  pixels, revisions, and retained candidates.

The exact numeric ceilings are a human approval gate during Phase A and must be
centralized in versioned policy, tested at boundaries, and included in
validation diagnostics. Implementations must not ship with `Infinity`,
effectively unbounded defaults, or limits derived solely from values declared
by the untrusted bundle.

## Camera, microphone, and privacy rules

The runtime and bundle loader do not request camera or microphone permission.
Only a host adapter initiated through clear user action may request it.
Permission for one modality does not imply permission for another.

For v1:

- process camera frames, tracking landmarks, microphone samples, RMS levels,
  and visemes locally by default;
- send only the minimum derived semantic values into the control contract;
- do not retain raw frames/audio, derived biometrics, recordings, transcripts,
  or device identifiers by default;
- show a persistent in-product indicator while capture is active and provide a
  keyboard-accessible stop/mute control;
- stop tracks and release devices when disabled, disconnected, hidden according
  to host policy, or disposed;
- prohibit bundles and AI commands from starting capture or changing privacy
  settings;
- require separate, informed opt-in before recording, persistence, telemetry,
  or network transmission, with stated destination, purpose, and retention;
- avoid placing user content, access tokens, full commands, filenames supplied
  by users, raw media, or landmarks in errors and analytics;
- keep telemetry disabled by default and allow the host/user to inspect and
  revoke it.

Camera-derived landmarks can constitute sensitive or biometric data depending
on jurisdiction and use. v1 does not perform identity recognition or create
biometric templates. Hosts are responsible for applicable notice, consent,
deletion, age, employment, and cross-border requirements.

## Accessibility as a safety control

Host policy and `prefers-reduced-motion` can clamp or disable bundle animation.
Bundles cannot override that policy. Emergency reset and stop-capture actions
remain keyboard accessible and available even if a controller floods commands.
Security and validation failures are conveyed in text without flashes, forced
motion, or sound-only warnings.

## Required verification

Before v1 release, tests must cover adversarial archives and paths, corrupt
images, invalid indices, NaN/Infinity, boundary resource totals, command floods,
spoofed identities, unauthorized origins, disconnect/reset behavior, denied
media permissions, capture shutdown, repeated failed loads, and
mount/dispose/context-loss resource cleanup. Fuzzing should target the manifest,
mesh, animation, path, and command parsers.

## Decisions requiring human approval

The following policy choices remain proposed:

1. numeric bundle, GPU, animation, queue, rate, and diagnostic limits;
2. remote pairing/authentication and session-expiry requirements for the
   first supported host adapter;
3. retention periods and approved destinations for any optional recording or
   telemetry;
4. whether v1 accepts only unpacked/direct bundles or also archive containers;
5. which security-reporting, dependency-audit, and fuzzing gates block release;
6. jurisdiction-specific privacy language and whether a formal data protection
   assessment is required.
7. cloud generation providers, destinations, retention, credential storage,
   and spending limits.

No unresolved item above permits weakening the invariant controls: no bundle
code, no bundle-triggered capture, no payload-defined trust, no unbounded
resource use, and no telemetry by default.
