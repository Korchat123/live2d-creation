# Local Generation Provider - Phase P0 Decision

Status: accepted for the Phase P1 spike  
Date: 2026-07-31

## Decision

Use a local ComfyUI instance as the first generation provider. Open Avatar is
the default output; provider concepts remain private authoring infrastructure
and do not enter the public runtime, bundle, or control contracts.

Phase P1 uses a deterministic fake provider in CI and one reviewed ComfyUI
workflow for a labelled physical smoke test. It does not install or download
ComfyUI, checkpoints, custom nodes, or other model files without explicit
authorization.

## Reference device

- Operating system: Windows 11 Home Single Language, version 10.0.26200.
- GPU: NVIDIA GeForce RTX 3050 6 GB Laptop GPU.
- System memory: approximately 16 GB.
- ComfyUI endpoint: loopback `127.0.0.1:8188`.
- Audit result: the endpoint was not running when P0 evidence was collected.

The Windows-reported adapter-memory field was lower than the marketed 6 GB and
is not used as the generation budget. Physical smoke evidence must record the
memory reported by the selected inference stack.

## Conservative P1 budgets

- one active generation job and no client-side job queue;
- one candidate output per request;
- at most 1024 by 1024 pixels and 4 MiB encoded image bytes;
- PNG or WebP input/output only; transparent part jobs require decoded alpha;
- at most 16 KiB of prompt text after UTF-8 encoding;
- 180-second job timeout with user cancellation;
- polling no faster than once per second when WebSocket progress is unavailable;
- no checkpoint is selected automatically;
- no custom workflow graph or provider endpoint is read from a project; and
- candidate output is temporary until explicit acceptance.

These are spike ceilings, not a promise that every 1024-pixel workflow fits in
6 GB VRAM. A physical run may lower the workflow resolution or use a tiled or
low-memory template. Raising a ceiling requires measured evidence and a policy
update.

## Required private provider behavior

The provider seam must support:

- health and capability discovery;
- explicit checkpoint selection from a host-supplied allowlist;
- reviewed template selection;
- prompt submission;
- progress or bounded polling;
- cancellation and disposal;
- one typed image result plus bounded diagnostics; and
- provenance for provider, adapter, template, checkpoint, seed, and artifact
  hash.

The seam is deliberately private in P1. It may become a package contract only
after the spike proves the lifecycle and security boundary.

## ComfyUI mapping

The adapter may map the private behavior to ComfyUI's documented prompt queue,
history, view, upload, object-info, and interrupt/queue controls. Endpoint names
must be verified against the installed ComfyUI version during the physical
smoke test.

User text can populate only an approved text-conditioning input. Template node
classes, links, paths, model identifiers, sampling ceilings, and output nodes
are controlled by reviewed application code.

## CI and physical evidence

Ordinary CI uses the fake provider and covers offline health, invalid
capabilities, rejection, timeout, cancellation, malformed JSON, unexpected
MIME, excessive bytes or dimensions, missing alpha, and cleanup.

The manual local smoke test records:

- ComfyUI and Python versions;
- GPU and inference-reported VRAM;
- workflow-template hash and node inventory;
- selected checkpoint and complete rights state;
- resolution, peak VRAM, duration, result dimensions, and encoded bytes;
- cancellation behavior; and
- confirmation that no arbitrary node, path, URL, or checkpoint came from the
  prompt.

## Sources

- [ComfyUI workflow concepts](https://docs.comfy.org/development/core-concepts/workflow)
- [ComfyUI workflow submission](https://docs.comfy.org/api-reference/cloud/workflow/submit-a-workflow-for-execution)
