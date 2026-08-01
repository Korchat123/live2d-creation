# Production model benchmark

Status: completed — prompt-only workflow rejected  
Started: 2026-08-01

This benchmark decides whether Animagine XL 4.0 Opt may replace Stable
Diffusion 1.5 as the approved local concept model. It does not approve any
generated image, checkpoint redistribution, repository release, or generated
character rights.

## Candidate checkpoint

- Model: Animagine XL 4.0 Opt
- Repository: <https://huggingface.co/cagliostrolab/animagine-xl-4.0>
- Exact file: `animagine-xl-4.0-opt.safetensors`
- Repository storage: prohibited; install only in the user's external ComfyUI
  shared checkpoint directory.
- Stated license: CreativeML Open RAIL++-M
- Published SHA-256:
  `6327eca98bfb6538dd7a4edce22484a1bbc57a8cff6b11d075d40da1afb847ac`
- Size: 6,938,350,040 bytes
- Verified local SHA-256:
  `6327eca98bfb6538dd7a4edce22484a1bbc57a8cff6b11d075d40da1afb847ac`
- Decision: not approved

The model card says the Opt checkpoint improves stability, anatomy, noise,
color saturation, and color accuracy. It also documents tag-based prompts,
CFG 5, 28 steps, Euler Ancestral, and 1024 by 1024 as the preferred square
resolution. The first hardware gate intentionally uses 768 by 768 because the
test machine has 6 GB VRAM.

## Frozen environment

- Operating system: Windows 11
- GPU: NVIDIA GeForce RTX 3050 Laptop GPU, 6 GB VRAM
- System RAM: approximately 16 GB
- ComfyUI: 0.29.2
- Python: 3.13.12
- PyTorch: 2.10.0+cu130
- Jobs: one at a time
- Batch size: 1
- Hardware-smoke canvas: 768 by 768
- Quality-suite canvas: 1024 by 1024
- Template: `open-avatar-concept-v1`
- Prompt profile: `animagine-xl-4`
- Sampler: Euler Ancestral
- Steps: 28
- CFG: 5

## Approved prompt suite

Each description runs at the model's documented native square resolution with
seeds `7`, `101`, `2027`, and `65537`, for twenty fixed requests total.

1. Original adult woman librarian, shoulder-length blue hair, round glasses,
   navy jacket, amber eyes, warm neutral expression.
2. Original adult man astronomer, short silver hair, teal eyes, dark high-neck
   uniform with small gold star pins, calm expression.
3. Original androgynous forest courier, wavy auburn hair, green eyes, moss
   cloak over a cream shirt, leaf-shaped ear accessory.
4. Original adult woman mechanic, black braided hair with orange streak,
   brown eyes, blue work jacket, yellow neck scarf, confident neutral
   expression.
5. Original adult man stage magician, violet swept-back hair, grey eyes, white
   shirt, burgundy vest, black bow tie, small crescent brooch.

The private planner adds the fixed single-character, front-view, upper-body,
complete-head, visible-neck, visible-shoulders, quality, and negative tags.

## Scoring protocol

For every output, record:

- exact seed, duration, completion/error state, and artifact SHA-256;
- exactly one character;
- entire head, hair, neck, and both shoulders visible;
- front-facing neutral upper-body pose;
- requested identity, palette, clothing, and accessory compliance;
- no text, watermark, signature, duplicate face, unrelated object, or severe
  anatomy artifact;
- peak stability observation, including any out-of-memory, frozen UI, or
  abandoned provider job.

Approval requires at least 80% single-character compliance, at least 90%
complete framing, no accepted image with a watermark or unrelated object, and
ten consecutive jobs without memory exhaustion or abandoned work. A 1024 by
1024 quality run is permitted after a 768 hardware smoke proves the checkpoint
can load and execute without memory exhaustion. Creative composition is scored
at 1024 because 768 is below the model's documented native square resolution.

## Exploratory smoke results

| Run              | Resolution | Result                                                                                                                                                   | Artifact SHA-256                                                   |
| ---------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Baseline         | 768        | Rejected: top of head and hair cropped. One character; no OOM.                                                                                           | `8771c06dc7190eed0c0fd75bd93af954808997834163df3576d34b8e4fba98ef` |
| Framing v1       | 768        | Rejected: top hair still clipped and a large decorative background object appeared. One character; no OOM.                                               | `d370aa4a36e92609e13982359f28d6146be89eb49716efd43cbc20b056b5324c` |
| Framing v2       | 768        | Rejected: severe head crop regression. One character; no OOM.                                                                                            | `c0ac5df2cc1ce125c327126f6761823cbf0bd1053124b124260d13b98854882c` |
| Native/full-body | 1024       | Framing pass: complete head, hair, neck, and shoulders; one character; plain background; no OOM. Palette warning: jacket rendered beige instead of navy. | `f3eb52b409d262101b19cab10d914eb38542adef6fcdaccd8be27c7214c3c6ea` |

The three failed 768 compositions show that prompt iteration at a non-native
resolution is not a useful production gate. The bounded 1024 run completed in
approximately 35 seconds. It justifies running the fixed native-resolution
suite but does not approve the model.

## Current evidence

- ComfyUI loopback health succeeded at `127.0.0.1:8188`.
- The RTX 3050 and CUDA backend were detected.
- 106.35 GiB of disk space was available before transfer.
- The checkpoint is outside the repository, complete, hash-verified, and
  discovered by ComfyUI.
- Four exploratory jobs completed without an out-of-memory error or abandoned
  queue entry; only the native 1024/full-body composition passed framing.
- The planner's deterministic provider request has unit coverage.
- The interpreted-request UI and private-project restore have Chromium
  coverage.

The fixed suite is complete. See
[`production-model-benchmark-results.md`](production-model-benchmark-results.md)
for all artifact hashes and scoring. Hardware compatibility passed, but the
prompt-only workflow failed framing and identity quality gates; the checkpoint
is not approved for production.
