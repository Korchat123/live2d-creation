# Part-first physical smoke

Status: structural pass; visual-quality gate failed  
Date: 2026-08-01  
Device: Windows 11, NVIDIA RTX 3050 Laptop GPU, local ComfyUI

## Input and workflow

The acceptance prompt described a petite Japanese-anime Gothic Aristocrat with
long white/light-blue hair, amber eyes, layered navy dress, corset, military
tailcoat, witch hat, stockings, Victorian boots, and skull cane.

Studio generated a controlled portrait concept, built the private character
record, enabled the complete v1 part plan, and submitted 25 purpose-specific
jobs in dependency order. Each accepted artwork was clipped to its own mask and
stored as a full-canvas transparent PNG. Four expression jobs followed.

Generated images and the exported project remain outside the repository.

## Structural result

- Runtime: approximately 17 minutes 43 seconds.
- Project bytes: `3,978,279`.
- Project SHA-256:
  `336d6f56ce39c09b9711f32cf331f0ef2256a14976d7613ca6820495e845a787`.
- Layer masks: 25.
- Generated part images: 25.
- Expression images: 4.
- Missing-art entries: 0.
- Part dimensions: 896 by 1152.
- Every generated part had visible pixels and transparent background pixels.
- The project source canvas was fully transparent.
- Face base, outfit front, accessory, and both arm/hand layers were present.
- Motion Lab loaded and reconstructed the preview without the flattened source.

## Visual review

The structural gate passes, but production art does not. The accessory mask
made the witch hat disproportionately large, and the coarse torso/outfit layers
did not preserve enough separately controllable skirt, stocking, boot, coat,
and lower-body detail. Fine eye and mouth fallback masks also require visual
correction.

The next iteration must create prompt-aware optional groups before generation:
headwear, held prop, side-hair locks, coat body/tails, sleeves/cuffs, corset,
skirt tiers, left/right legs, stockings, and boots. It must add composite
comparison and per-part bounds/scale checks before a project can pass the visual
gate.
