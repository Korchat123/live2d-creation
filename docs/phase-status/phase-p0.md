# Phase P0 status

Status: accepted for the safe-provider spike  
Reviewed: 2026-07-31

## Approved decisions

- Support both outputs. Open Avatar is the default automated rig, preview, and
  export. A Cubism-ready PSD is an optional additional handoff.
- Only Cubism data imported, rigged or verified, and exported through an
  approved Live2D Cubism Editor version is labelled a Live2D Cubism model.
- Local ComfyUI is the first provider. Provider concepts remain private during
  P1 and ordinary CI uses a deterministic fake.
- The reference device is Windows 11 with an RTX 3050 6 GB laptop GPU and about
  16 GB system RAM. P1 uses conservative single-job and artifact limits.
- No arbitrary discovered checkpoint is chosen automatically. When exactly one
  installed checkpoint is present in the host allowlist, Studio may select that
  sole approved choice. Unknown checkpoint, LoRA, control
  model, or generated-output rights block export.
- The existing uncommitted Studio changes are preserved and assigned to the
  root P1 integration task. They are prototype input, not accepted P1 evidence.

## Existing-work audit

The Studio prototype currently:

- uploads a portrait and masks through a fixed Vite development proxy;
- builds inpainting and SAM-style workflow graphs inside `authoring.ts`;
- discovers checkpoints and sometimes selects the first non-SAM result;
- polls history for up to 90 seconds;
- has no generation abort signal or provider cancellation;
- validates only a small portion of response structure; and
- is primarily crop/segmentation/inpainting based.

P1 must extract a private provider seam, remove automatic checkpoint selection,
add bounded validation and cancellation, and introduce one prompt-to-candidate
path. Existing crop-first behavior may remain as an explicitly labelled legacy
tool but cannot be the default planned workflow.

## Evidence

- `live2d-model-plan.md`
- `docs/adr/0001-runtime-and-format.md`
- `docs/architecture/generation-provider.md`
- `docs/security/threat-model.md`
- `docs/authoring/rights-checklist.md`
- local hardware inspection on 2026-07-31
- local ComfyUI health probe on 2026-07-31

## Deferred evidence

ComfyUI was not running during P0 review. The installed version, node inventory,
checkpoint rights, inference-reported VRAM, timing, peak memory, and
cancellation behavior remain P1 physical-smoke evidence. This does not block
the fake-provider implementation, but the P1 gate cannot close until the
labelled local smoke test passes.
