# Phase P3 status: purpose-generated artwork

Status: one-click local draft passed; production art gate blocked  
Reviewed: 2026-08-01

The strict independent-parts default described later in this document is now a
superseded experiment. Independent diffusion jobs did not preserve a coherent
character direction. The revised production plan restores one coherent
reference, separates visible semantic layers, and generates only concealed
overlap pixels. See
`docs/authoring/reference-first-material-separation-plan.md`.

## Implemented

- Private purpose-generated part jobs are locked to the accepted concept hash,
  character bible, canonical 2048 by 2048 canvas, normalized anchors, enabled
  part plan, dependency order, and concealed-overlap target.
- Full-canvas RGBA validation measures alpha bounds and rejects empty,
  edge-clipped, anchor-drifted, or insufficient-overlap artifacts.
- Accepted-part validation reports missing required parts and duplicate content.
- Candidate revisions are immutable. Retry adds a pending variant; accept or
  reject creates a new state and cannot mutate an earlier accepted state.
- Cancellation and wrong-part/wrong-concept provider output leave the current
  revision unchanged.
- The existing Portrait Layer Lab retains layer selection, previews, mask and
  artwork correction, undo/redo, generated repair comparison, and Motion Lab
  handoff. Its source-cropped starter masks remain explicitly ineligible for
  P3 acceptance.
- The default Studio flow now hides P2 and Portrait Layer Lab, automatically
  passes the controlled concept into segmentation and generated repair, creates
  expression states, validates the parts, persists the large project in
  IndexedDB, and enables project download and Motion Lab preview.
- A physical one-prompt/one-click run produced 24 layers, 24 generated-artwork
  entries, four expression states, and zero missing-art entries.
- The prompt-aware expanded physical run produced 35 separate masks and
  generated-art entries, four expressions, and zero missing-art entries. It
  proved separate coat, sleeves, corset, skirt, legs, footwear, hat, prop, and
  arm jobs, but visual approval remains blocked by an obscured generated face.
- The default automatic route no longer requests a complete portrait. It starts
  from a transparent canonical canvas and generates each enabled part inside a
  bounded region, conditioned only on the text specification and already
  generated dependency composite. Each purpose-generated part is isolated with
  part-specific SAM cleanup, with bounded difference as fallback, before the
  first full-character composite is assembled. Complete-portrait segmentation
  remains a legacy/import recovery path.

## Blocking art evidence

P3 cannot pass until all of the following are true:

1. the composition workflow passes its fixed quality gate;
2. the automatic build derives stable internal identity metadata and anchors
   without requiring a separate user-facing P2 screen;
3. a separately rights-reviewed identity-conditioning workflow proves that
   purpose-generated parts preserve the accepted character;
4. every enabled required part is generated, reviewed, and accepted with
   transparent full-canvas artwork and measured hidden overlap; and
5. the accepted neutral composite receives a human art-quality decision.

The one-click workflow may package a local draft without a separate concept
acceptance screen, but it must retain provenance and limitations. Production
approval and release remain dependency-blocked by the P3 art gate, even where
legacy prototypes already demonstrate portions of later behavior.

## Verification

Focused Studio typecheck and seven P3 artifact/orchestration tests pass. The
repository-wide `pnpm run ci` result is recorded at handoff after all current
changes are complete.
