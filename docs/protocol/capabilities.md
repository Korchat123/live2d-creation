# Capability acceptance specification

Status: Phase A proposal

This document defines observable product behavior without fixing a bundle
schema, command envelope, renderer, or model-specific parameter names. Later
protocol work may choose wire representations, but it must preserve these
semantics. A runtime reports which semantic capabilities and named content it
supports; unsupported requests fail explicitly and leave the current pose
stable.

The words MUST, MUST NOT, SHOULD, and MAY describe acceptance obligations. Time
tolerances and visual thresholds are fixture-owned test data established before
implementation, not hidden constants in the public protocol.

## Semantic requirements

### CAP-EXP-001

An expression request MUST select a declared semantic expression by stable
content identifier and blend it from the evaluated current state. A test passes
when the requested expression reaches its declared target within the fixture's
blend tolerance without changing undeclared channels. It fails on a snap outside
the declared transition policy, channel leakage, or silent substitution.

### CAP-MOT-001

A motion request MUST play a declared named motion with observable start,
running, and terminal states. A test passes when a fake clock produces the same
sampled poses and terminal acknowledgement on repeated runs. It fails if the
motion changes undeclared channels, depends on wall-clock timing, or never
reaches a terminal state.

### CAP-GAZ-001

Gaze MUST accept normalized semantic horizontal and vertical focus values,
clamp finite out-of-range input safely, and affect only declared gaze/head
follow channels. A test passes when center and four extrema move focus in the
expected direction, remain within fixture limits, and return to center. It fails
on non-finite acceptance, inversion, overshoot, or unrelated pose changes.

### CAP-BLK-001

Blink MUST support an explicit blink and an optional deterministic idle-blink
schedule. A test passes when both eyes close and reopen through the fixture's
declared curve, an explicit blink has a terminal acknowledgement, and the same
seed and fake clock reproduce idle blink samples. It fails if reset leaves an
eye closed or reduced motion disables necessary eye closure.

### CAP-MOU-001

Mouth openness MUST accept a normalized semantic intensity from closed to open,
clamp finite input, and smooth changes according to the declared response
policy. A test passes when closed, midpoint, and open inputs are visually
ordered, bounded, and affect only declared mouth-related channels. It fails on
phoneme inference, non-finite acceptance, or unrelated channel changes.

### CAP-POS-001

Pose MUST select a declared semantic pose by stable content identifier and
transition from the evaluated current state. A test passes when the target pose
is reached within its declared tolerance and remains stable after the transition
ends. It fails if an unknown pose is substituted or a completed pose continues
to drift.

### CAP-INT-001

Interruption MUST follow declared priority and transition policy. Human control
MUST temporarily override conflicting AI control while non-conflicting inputs
may continue. A test passes when an interrupted action receives a terminal
cancelled/interrupted result exactly once, the transition begins from the
currently evaluated pose, and control returns according to policy without a
visual jump. It fails on double completion, stale queued control, or AI winning
a conflicting human override.

### CAP-RST-001

Reset MUST cancel active and queued actions, clear transient overrides, and
return all declared semantic channels to a stable neutral state. A test passes
when reset from every fixture action produces the same neutral pose and no later
fake-clock advance resurrects old work. It fails if reset depends on the prior
path or leaves pending acknowledgements unresolved.

### CAP-RED-001

Reduced-motion mode MUST preserve meaning and direct control while suppressing
or reducing nonessential idle motion, large secondary motion, and decorative
transitions. A test passes when expressions, mouth control, gaze focus, explicit
blink, pose selection, interruption, and reset remain operable while the
fixture's decorative-motion budget is not exceeded. It fails if information is
lost or reduced motion merely slows every action indiscriminately.

### CAP-HUM-001

A human controller and an AI controller MUST use the same validated semantic
control boundary. A test passes when the same valid scenario sent by either
source yields equivalent acknowledgements and sampled poses before priority is
applied. It fails if either source requires a provider-specific or UI-specific
semantic command.

### CAP-AIC-001

AI-originated commands MUST be bounded, validated, cancellable, and unable to
bypass capability discovery. A test passes when unsupported content, invalid
ranges, non-finite input, excess-rate continuous updates, and cancellation are
handled predictably without destabilizing the last valid pose. It fails on
implicit privilege, unbounded queues, or provider-specific fields.

### CAP-HOV-001

During simultaneous control, a human input MUST take precedence over a
conflicting AI input for the declared override window. A test passes when AI
mouth input continues during a non-conflicting human gaze override, while a
conflicting AI gaze update cannot replace the human gaze until release or
expiry. It fails if priority applies globally to unrelated channels or if stale
AI input jumps into effect after the window.

## Audio-to-mouth v1 decision

Version 1 SHOULD expose RMS-derived mouth openness only. An audio adapter may
convert a bounded root-mean-square energy window into the same normalized
mouth-open semantic input described by `CAP-MOU-001`; the runtime does not
receive raw audio or infer speech content. This is deterministic enough to test,
keeps microphone processing outside the core runtime, works with human speech
and generated audio, and does not pretend that amplitude is a phoneme.

Visemes are deferred. A future optional capability may provide time-aligned
semantic viseme labels when there is evidence that the reference art, rig,
latency budget, languages, and privacy policy justify them. It must be
negotiated through capability discovery and degrade to mouth openness. V1
content and controllers MUST NOT require visemes.

## Conformance setup

Conformance tests use a declared fixture, fake monotonic clock, fixed random
seed, sampled evaluated poses, acknowledgement log, and renderer observations
where visual ordering matters. Tests compare semantic outcomes and affected
channel sets rather than internal or model-specific parameter names. Exact
schema, envelope, cancellation codes, and limits belong to Phase B contracts.
