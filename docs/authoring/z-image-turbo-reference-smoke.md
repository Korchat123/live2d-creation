# Z-Image Turbo reference smoke

Result: reference-generation pass; downstream Live2D build not evaluated  
Completed: 2026-08-01  
Reference device: NVIDIA GeForce RTX 3050 6 GB Laptop GPU

## Reviewed workflow

- Diffusion model: `z_image_turbo_bf16.safetensors`.
- Text encoder: `qwen_3_4b.safetensors` loaded as Lumina2 CLIP.
- VAE: `ae.safetensors`.
- Canvas: 768 by 1152, batch size one.
- Sampler: `res_multistep`, simple scheduler, eight steps, CFG 1, shift 3.
- Composition ControlNet: disabled.
- Style: VTuber.
- Prompt requested an adult anime catgirl with long black hair streaked blue,
  amber eyes, a black cat hoodie jacket, white pleated mini skirt, and black
  ankle boots.

The workflow completed successfully in approximately 40.16 seconds. The
generated PNG remains outside the repository. It was 608,204 bytes with
SHA-256
`3b0e32fbd9b85ea029f1d136b8d18d599fe287f65bbd7cedbb68848930056013`.

## Visual review

The candidate passed the bounded reference criteria exercised by this smoke:

- one centered front-facing character;
- complete head, hair, hands, legs, and boots inside the portrait canvas;
- readable face and both amber eyes;
- black hair with blue accents;
- black cat-ear hoodie and white pleated skirt remain separate garments;
- plain white background; and
- no OpenPose guide, black face void, floor-length coat, or zipper extending
  below its garment.

The result is a reference-generation improvement, not proof of a completed
Live2D model. It does not approve semantic masks, concealed artwork,
expressions, rigging, or Motion Lab export. Z-Image Turbo remains a distinct
split-model concept profile. Animagine remains the separately recorded
checkpoint for SD inpainting until hidden-only generation is implemented and
physically validated.

## Studio display follow-up

On 2026-08-02, a generated Z-Image PNG appeared in ComfyUI but not in Studio.
The provider had completed correctly; Studio rejected the new
`open-avatar-z-image-turbo-v1` provenance identifier before persisting and
rendering the candidate. The accepted-concept validator now includes that
reviewed template and requires its separately approved classic part
checkpoint.

The follow-up browser-driven physical smoke completed in approximately 39.8
seconds. Studio displayed `1 candidate saved` and revealed the candidate for
review. The external 413,204-byte PNG had SHA-256
`8bce04059d711f0e1d4ec95439515083c39ab80d153798990ab9a1bcd81f274f`.
