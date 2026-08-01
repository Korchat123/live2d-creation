# Staged body and wardrobe physical smoke

Result: structural pass, visual fail  
Completed: 2026-08-01  
Reference device: NVIDIA GeForce RTX 3050 6 GB Laptop GPU

## Scope

This run tested the real default flow after adding VTuber/anime style presets
and the internal generation order: safe base body, face, hair, clothing,
accessories, expressions, project save, and automatic Motion Lab handoff.

The prompt requested an adult original anime VTuber woman with long black hair
streaked blue, amber eyes, an orange-and-white cat hoodie jacket, a white
pleated skirt, black ankle boots, and a neutral front pose. The VTuber preset
was selected. The accepted generated artifact and project remain outside the
repository.

## Structural result

- The controlled reference generated and was accepted automatically.
- The real queue began with torso, neck, face base, legs, and arms before face,
  hair, outfit, and footwear work.
- The run completed in approximately 36 minutes 41 seconds without OOM.
- Motion Lab opened automatically.
- Project bytes: `3,441,337`.
- SHA-256:
  `b887f5bd05e79dcfffe12da4c6d7a260e12142d85aa4a30aca36d0e4976ef889`.
- Masks: `28`.
- Generated artwork entries: `28`.
- Expressions: `4`.
- Recorded missing-art entries: `0`.

## Visual failure

The Motion Lab capture failed the art gate. The reconstructed avatar contained
disconnected rectangular body blocks, an incomplete silhouette, broken facial
assembly, and incomplete wardrobe presentation. Count-based validation had
incorrectly treated the presence of 28 masks and artwork entries as success.

SAM3 or pixel heuristics failed or required bounded candidates for the neck,
left leg, left eye white, pupils, eyelids, eyebrows, tongue, and left footwear.
Those fallbacks are useful generation regions but are not acceptable semantic
layers. The run therefore does not validate the new style or wardrobe quality.

## Corrective decision

Studio now blocks automatic Motion Lab handoff whenever a required job used an
unverified pixel or bounded fallback. SAM segmentation is always conditioned
on the immutable accepted neutral master rather than the partially generated
composite. Motion Lab now prefers the validated IndexedDB project over the
legacy session draft. Base-body prompts also exclude wardrobe instructions;
only clothing and accessory stages receive the outfit prompt.

The next physical run must stop with a precise semantic error on this same
failure profile. A visual pass requires verified semantic masks and neutral
reconstruction, not merely matching layer counts.
