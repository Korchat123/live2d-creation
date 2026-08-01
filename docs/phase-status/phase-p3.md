# Phase P3 status: reference-first material separation

Status: neutral-master gate and automatic handoff implemented; production art gate blocked

Reviewed: 2026-08-01

The strict independent-parts route is a superseded experiment. Independent
diffusion jobs did not preserve one coherent face, direction, silhouette,
lighting, or garment construction. The production route accepts one coherent
neutral master, separates its reviewed visible semantic layers, and generates
only the concealed overlap required by approved motion. See
`docs/authoring/reference-first-material-separation-plan.md`.

## Implemented production gates

- Studio visibly presents the interpreted prompt, approved checkpoint,
  candidate history, provenance/hash, optional rejection note, Accept neutral
  master, Reject, and Regenerate controls.
- Generating a reference stops for one user decision. Accepting it, or explicitly
  resuming an already accepted reference, starts the downstream build.
- The private versioned reference-review state records up to four validated
  embedded candidates, selection, rejection reason/timestamp, and exactly one
  immutable accepted candidate keyed by its artifact SHA-256.
- Pending, rejected, selected, and accepted decisions persist in IndexedDB. An
  accepted neutral master restores after reload without automatically restarting
  ComfyUI work; the user explicitly resumes it.
- Accept or resume automatically creates the private character specification,
  landmarks, orientation, and prompt-aware manifest, then starts the build. The
  retired Phase P2 form and user landmark marking are absent. A concept hash
  mismatch cannot silently restore an unrelated authoring project.
- A successful automatic build saves the project and opens Motion Lab for the
  user's final test.
- The authoring prompt now requests an orthographic-looking centered front pose,
  level features and body axes, neutral mouth/open eyes, separated arms/legs,
  5–10% silhouette margins, visible hands and shoes, even lighting, and props
  beside rather than across the face or central torso.
- Corrupt, oversized, remote-image, mismatched-hash, duplicate, invalid-version,
  and invalid-transition review state fails safely. A storage failure cannot
  create an accepted downstream project.
- Existing generated Open Avatar v1 projects remain importable, but they do not
  gain a new neutral-master approval claim.

## Superseded experimental evidence retained

- Private purpose-generated part jobs remain locked to the concept hash,
  character bible, canonical canvas, anchors, dependency order, and overlap
  target.
- Immutable part candidates, cancellation, alpha bounds, missing/duplicate
  checks, and prompt-aware manifests remain useful implementation evidence.
- Earlier 24-layer and 35-layer one-click runs proved queue, storage, and
  structural packaging mechanics but failed visual identity and/or framing
  gates. Bounded rectangles and image-difference fallbacks are not eligible for
  production acceptance.

## Blocking art and engineering evidence

P3 remains blocked until all of the following pass in order:

1. define and round-trip the 896 by 1152 reference to 2048 by 2048 canonical
   transform, character-relative orientation, and immutable invalidation graph;
2. persist a registered, non-exported technical pack containing false-color
   ownership, edges, pose, landmarks, constraints, and provenance;
3. connect provider masks to the semantic selector and pass the five-case
   visible benchmark: face/hair, eye/blink, coat/ruffle, leg/boot, hand/prop;
4. prove protected visible pixels and expression pixels outside accepted masks
   remain byte-identical;
5. implement alpha-aware reconstruction and material-specific hair/lace,
   same-color contact, shadow, and transparency decisions;
6. validate the cyan motion-swept concealed masks automatically before
   hidden-only inpainting and preserve them as final diagnostics;
7. implement automatic per-part decisions, dependency invalidation,
   checkpoint/resume, blob storage, and explicit
   merge/bake/rigid/reduced-motion fallbacks; and
8. pass final motion, storage, cancellation, rights, hostile-input, FPS, memory,
   automated art gates and final Motion Lab user testing.

Current operational risks are bounded but unresolved: candidate images still
use embedded data URLs until the scheduled Blob-store migration; legacy
authoring projects need explicit reference confirmation; automated framing and
anatomy diagnostics are not yet implemented; and part-build cancellation is
not yet resumable.

## Verification

- Studio typecheck passes.
- All 120 repository unit tests pass, including the four-test reference-review
  state suite.
- All 18 focused Chromium, Firefox, and WebKit acceptance tests pass reference
  persistence, explicit automatic-build resume, removal of the Phase P2 UI,
  existing project import, safe unconfigured-provider behavior, and Motion Lab
  failure safety.
- The repository-wide `pnpm run ci` passes formatting, lint, type checks, unit
  tests, safety/rights/requirements gates, and production builds.
