# Prompt-first authoring execution plan

The canonical product and delivery plan is
[`live2d-model-plan.md`](live2d-model-plan.md). This file records the immediate
execution order for the product pivot.

## Outcome

Use a prompt-first, reference-first workflow that generates one coherent design,
separates it into semantic full-canvas transparent layers, and inpaints only
the concealed overlap required for supported motion.
Keep the existing Open Avatar runtime as the automated rig and preview path.
Add non-destructive prompt edits for generated projects. Export a layered
Cubism-ready PSD, then use Live2D Cubism Editor for a genuine `.moc3` export.

## Current position

- Existing runtime, validation, Studio, and Motion Lab foundations are retained.
- Six Studio files contain substantial uncommitted authoring and ComfyUI work.
  They belong to the user/current task and must not be overwritten or reverted.
- The output target is approved: support both, with Open Avatar as the default
  and Cubism as the optional Editor handoff.
- The provider foundation and private automatic character-lock boundary are
  accepted. The former user-facing Phase P2 is retired. The current work item
  is the production-model control experiment required before production part
  generation.
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
3. **Automatic character lock — completed internally.** After explicit neutral
   master approval, derive the private specification, landmarks, orientation,
   and part graph without a user form, then continue automatically.
4. **P3 — generate parts.** Generate aligned transparent layers with concealed
   overlap; validate each part and neutral composite automatically, then open
   Motion Lab when the complete build passes.
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
