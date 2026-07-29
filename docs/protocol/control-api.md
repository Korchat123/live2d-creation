# Control API

Status: Phase B contract, version 1.0

Humans, AI systems, and deterministic automation use the same provider-neutral
command envelope. Inputs are validated before scheduling. A controller must
query capabilities instead of assuming that content or behavior exists.

## Envelope

Every untrusted command payload has `protocolVersion`, a caller-generated `id`,
and a `type`. The trusted host attaches the control source (`human`, `ai`, or
`automation`) after authenticating and authorizing the adapter; payloads cannot
claim their own identity or priority. An optional non-negative monotonic
`timestamp` may support ordering; it is not wall-clock authority. Version 1
accepts `1.x` and rejects every other major version.

Command types are:

- `capability.query` discovers semantic capabilities and named content;
- `control.set` updates gaze or mouth openness;
- `action.play` requests blink, expression, motion, or pose;
- `command.cancel` cancels a command by identifier;
- `control.reset` cancels work and restores neutral state.

Continuous gaze and mouth updates must carry `delivery.mode: "coalesce"`,
a channel-matching `delivery.key`, and `supersedesPending: true`. A scheduler
may replace an unprocessed update with the newest update for that key, bounding
latency and queue growth. It must not coalesce discrete actions.

## Results and errors

Acknowledgements identify the request and report `accepted`, `completed`, or
`cancelled`. Capability reports contain supported semantic capability names,
named expression/motion/pose content, and active security limits. Errors use a
stable code, safe human-readable message, and `retryable` flag. Terminal
completion, cancellation, interruption, or error is emitted exactly once.

Defined error codes cover invalid envelopes, unsupported versions and
capabilities, unknown content, cancellation, interruption, and rate limiting.

## Validation and security

The canonical JSON schemas use Draft 2020-12. Unknown properties are rejected,
which excludes provider-specific prompts/models and UI-specific widgets or
events. Numeric inputs must be finite and bounded. Identifiers are 128
characters or fewer.

Implementations must enforce the exported limits before allocating or queueing:
16 KiB per envelope, 120 commands per second, 1 MiB per manifest, 256 assets,
and 256 parameters. Bundle asset paths are forward-slash relative paths only;
absolute paths, Windows drive paths, backslashes, and `..` traversal are
rejected. Validation does not authorize filesystem or network access.

Schemas and validation functions are exported by `@open-avatar/schema`.
