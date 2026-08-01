# Expanded part-first physical smoke

Status: structural pass; visual-quality gate failed  
Date: 2026-08-01  
Device: Windows 11, NVIDIA RTX 3050 Laptop GPU, local ComfyUI

## Input and workflow

The prompt described a petite Japanese-anime Gothic Aristocrat with long white
and light-blue hair, amber eyes, a layered navy dress, corset, military
tailcoat, witch hat, stockings, Victorian boots, and a skull-topped cane.

The prompt-aware planner enabled separate coat tails, sleeves, corset, skirt,
legs, footwear, headwear, held prop, and arm/hand jobs. The one-click browser
flow generated each enabled part in dependency order and followed with four
expression jobs. Generated output and the downloaded project remain outside
the repository.

## Structural result

- Runtime: 24 minutes 3 seconds.
- Project bytes: `4,951,065`.
- Project SHA-256:
  `89148e2a7da9508b1bd8a2895089e02119c3cd4d1a4801d6f4b3544073f9349a`.
- Layer masks: 35.
- Generated part images: 35.
- Expression images: 4.
- Missing-art entries: 0.
- Every part is 896 by 1152 RGBA and contains both visible and fully
  transparent pixels.
- The source canvas contains 1,032,192 transparent pixels and zero visible
  pixels.
- Motion Lab loaded a parts-only neutral reconstruction.

## Visual review

The expanded manifest materially improves separate coat, skirt, legs, boots,
hat, cane, and arm control. The project is still not production-approved. The
generated concept obscured most of the face with a dark region, individual
facial fallback masks produced incoherent features, and the hat remained too
dominant. Because all part jobs inherit the accepted concept, later repair jobs
cannot reliably recover identity that is absent from that reference.

The concept workflow now requests a fully visible, evenly lit face, both eyes
visible, and hair/headwear that does not cover the face. Matching negative
constraints reject hidden, shadowed, or covered faces. The prompt planner also
recognizes phrases such as "long white hair" so side-hair jobs are enabled.
A future labelled run must validate these prompt changes; production approval
still requires automated subject/face quality checks and identity-reference
conditioning rather than prompt wording alone.
