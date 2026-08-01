# Prompt-first authoring execution plan

The canonical product and delivery plan is
[`live2d-model-plan.md`](live2d-model-plan.md). This file records the immediate
execution order for the product pivot.

## Outcome

Replace the portrait-cropping-first workflow with a prompt-first workflow that
generates a consistent design and purpose-built, full-canvas transparent parts.
Keep the existing Open Avatar runtime as the automated rig and preview path.
Add non-destructive prompt edits for generated projects. Export a layered
Cubism-ready PSD, then use Live2D Cubism Editor for a genuine `.moc3` export.

## Current position

- Existing runtime, validation, Studio, and Motion Lab foundations are retained.
- Six Studio files contain substantial uncommitted authoring and ComfyUI work.
  They belong to the user/current task and must not be overwritten or reverted.
- The output target is approved: support both, with Open Avatar as the default
  and Cubism as the optional Editor handoff.
- Phases P0, P1, and P2 are accepted. The current work item is the
  production-model control experiment required before P3 part generation.
- Animagine XL 4.0 Opt is hardware-compatible but its prompt-only benchmark is
  rejected: 17/20 complete framing and repeated identity drift. The next
  experiment adds reviewed composition and identity conditioning.

## Ordered work

1. **P0 — completed.** Record the approved dual-output decision,
   then decide local ComfyUI hardware, model/checkpoint rights, the detailed
   Cubism handoff, and how to integrate the current Studio changes.
2. **P1 — completed.** Prompt box, local endpoint health, one
   allowlisted workflow, progress, cancellation, bounded artifacts, provenance,
   and fake-provider CI.
3. **P2 — completed.** Concept variants, explicit design approval,
   character bible, landmarks, and editable part graph.
4. **P3 — generate parts.** Generate aligned transparent layers with concealed
   overlap; inspect and approve each part and the neutral composite.
5. **P4 — correct and export source.** Mask/paint correction, hierarchy
   validation, deterministic project round-trip, and Cubism-ready PSD.
6. **P5 — auto-rig.** Generate a conservative Open Avatar rig, validate all
   parameter extremes, and preview it in Motion Lab.
7. **P6 — prompt edits.** Upload a generated project; revise eye color, hair, or
   clothing through dependency-aware candidate revisions.
8. **P7 — Cubism handoff.** Import the PSD, complete/verify rigging in Cubism
   Editor, and export/test `.moc3` and `.model3.json`.
9. **P8 — harden.** Accessibility, security, performance, soak, documentation,
   licensing, and release-readiness evidence.

Every behavior change adds CI coverage. All workspace packages remain private,
and no publish, deployment, signing, commit, or push is authorized by this
plan.
