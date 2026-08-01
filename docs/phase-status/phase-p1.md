# Phase P1 status

Status: accepted  
Reviewed: 2026-07-31

## Implemented evidence

- Studio presents prompt-first concept generation before the legacy portrait
  tools.
- The private app-local provider seam supports health, explicit approved
  checkpoint discovery, generation progress, cancellation, and one candidate.
- The ComfyUI adapter uses one reviewed fixed workflow with a node allowlist,
  768-pixel canvas, one output, bounded sampling, and no prompt-controlled path,
  URL, node, or checkpoint.
- Checkpoints must be present in host configuration and the installed inventory;
  no discovered checkpoint is selected automatically.
- Prompt size, seed, job concurrency, timeout, output type, filename,
  subfolder, encoded bytes, decoded dimensions, alpha policy, and artifact hash
  are bounded or validated.
- Abort requests interrupt the single local job and request removal from the
  ComfyUI queue.
- Candidates show dimensions, seed, and a shortened artifact hash and remain
  outside the active project.
- CI uses a deterministic fake and mocked ComfyUI responses. It covers request
  limits, node allowlisting, health intersection, success, cancellation, image
  signature/MIME, dimensions, and alpha.

## Configuration

The Vite development bridge targets loopback `127.0.0.1:8188`.
`VITE_COMFY_CHECKPOINTS` supplies a comma-separated host allowlist. This value
must name only installed checkpoints whose rights have been reviewed. It is
host configuration and is not stored in projects.

## Physical provider evidence

- ComfyUI `0.29.2`, frontend `1.47.11`, Python `3.13.12`, PyTorch
  `2.10.0+cu130`, and CUDA were reported by the local provider.
- CUDA reported an RTX 3050 6 GB Laptop GPU with 6,441,926,656 bytes total and
  5,403,312,128 bytes free before the run.
- Every required reviewed node was installed: `CheckpointLoaderSimple`,
  `CLIPTextEncode`, `EmptyLatentImage`, `KSampler`, `VAEDecode`, and
  `SaveImage`.
- The official SD 1.5 EMA-only SafeTensors checkpoint was downloaded outside
  the repository. Its 4,265,146,304-byte file matched published SHA-256
  `6ce0161689b3853acaa03779ec93eafe75a02f4ced659bee03f50797806fa2fa`.
- A 768 by 768, 20-step, one-output workflow completed successfully in 13.502
  seconds according to ComfyUI execution timestamps.
- The lowest observed free VRAM was 2,986,591,024 bytes. Sampling began before
  the monitor attached, so this is evidence of staying within the device, not a
  guaranteed peak-memory measurement.
- The PNG artifact was 901,830 bytes with SHA-256
  `cd77b03183bc00a892b797281de1779a2a35290be3d1c57bc708010dc6e2b0cc`.
- Visual review rejected the candidate because it contained two characters, an
  unrelated orb, and a non-neutral pose. It is pipeline evidence only and is
  not accepted into a project. The rejected PNG was removed from the local
  ComfyUI output directory after its evidence was recorded.
- A second job was interrupted after one second at `KSampler`. ComfyUI recorded
  `execution_interrupted`, returned no output, and left running and pending
  queues empty.

## Gate decision

P1 is accepted. The provider lifecycle, limits, reviewed workflow, success,
cancellation, and cleanup are evidenced on the reference device. Image quality
is deliberately deferred to P2 model/character-bible evaluation; the smoke
checkpoint is not approved as the production character model.
