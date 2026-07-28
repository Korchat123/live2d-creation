# ADR 0002: Supported Platforms and Human-Control Baseline

- Status: Proposed
- Decision owners: product, security, and accessibility maintainers
- Human approval required: yes
- Scope: v1 browser runtime, Studio, and embedded web component

## Context

Open 2D Avatar must be controllable by people and software through the same
semantic API. A support promise must be small enough to test continuously while
covering the major browser engines. The renderer is expected to use WebGL in
v1; WebGPU is experimental and cannot be required.

## Proposed v1 decision

### Browser support

The v1 release supports the latest two stable desktop major versions available
at release time of:

- Google Chrome on Windows and macOS;
- Microsoft Edge on Windows;
- Mozilla Firefox on Windows and macOS;
- Apple Safari on macOS.

The runtime requires JavaScript modules, WebGL 2, Web Audio only when an
audio adapter is enabled, and browser APIs that remain available in a secure
context where the browser requires one. A WebGL 2 capability check occurs
before bundle allocation. Failure produces an accessible diagnostic and a
non-animated fallback supplied by the host; it must not leave a blank,
unexplained canvas.

Chrome and Edge share an engine, but both remain in the release matrix because
enterprise policy, GPU blocklists, and update behavior differ. At least one
Chromium browser, Firefox, and Safari must pass the release suite.

Mobile browsers, embedded webviews, Firefox ESR, Linux distributions,
screen-capture/streaming software integrations, WebGPU, and browsers outside
the stated window are best-effort or future work for v1. They must not be
advertised as supported without their own release evidence. Touch controls
should remain usable, but this does not constitute mobile support.

### Reference development device

The proposed minimum performance reference is a physical, unplugged-capable
Windows 11 laptop with:

- Intel Core i5-8250U-class four-core CPU or equivalent;
- Intel UHD Graphics 620-class integrated GPU or equivalent;
- 8 GB RAM;
- 1920 by 1080 display;
- 1x device-pixel ratio for the canonical benchmark;
- current stable Chrome, hardware acceleration enabled, balanced power mode,
  and no developer-tools recording during the measured run.

The exact model, OS build, browser build, GPU driver, power state, thermal
state, avatar fixture hash, and measurement procedure must be recorded in each
performance report. Equivalent hardware is acceptable for development, but a
release claim must be reproduced on the named physical device.

The initial performance targets remain those in the product plan: sustained
60 FPS and P95 main-thread frame work below 12 ms for the canonical v1 avatar
at 1x DPR. Passing on faster hardware does not satisfy this gate.

### Accessibility baseline

The Studio and first-party controls target WCAG 2.2 AA. For v1:

- every control is operable by keyboard, has a visible focus indicator, an
  accessible name, and a programmatic state/value;
- focus order follows visual and task order, with no keyboard trap;
- status, validation, connection, and command errors are available as text and
  do not rely on color, sound, or animation alone;
- controls meet AA contrast requirements and pointer targets use the WCAG 2.2
  minimum target-size rule or an allowed exception;
- the avatar canvas has a concise accessible name and text fallback; decorative
  canvas instances are hidden from assistive technology;
- no v1 behavior flashes more than three times per second;
- microphone and camera controls expose permission state and an obvious stop
  action;
- automated accessibility checks and keyboard scenarios run in CI, followed by
  a manual screen-reader smoke test for release.

`prefers-reduced-motion: reduce` is honored by default. It disables idle
oscillation, secondary physics, parallax, shake, bounce, and nonessential
automatic transitions; fades are removed or shortened to at most 100 ms.
Blinking and mouth movement may remain only when needed to communicate current
state or speech, and must avoid exaggerated motion. User preference overrides
the OS setting only after an explicit choice and must be reversible. Hosts can
force reduced motion through the public runtime option.

Author-provided accessibility labels and reduced-motion mappings are validated,
but bundle metadata cannot weaken host accessibility policy.

## Human approval gates

The following are proposals, not accepted product commitments, until a human
owner records approval:

1. the browser matrix and rolling two-major-version window;
2. the exact physical reference device and performance measurement recipe;
3. the 60 FPS, 12 ms P95, DPR, texture, memory, and bundle budgets;
4. WCAG 2.2 AA as the release conformance target and the manual assistive
   technology matrix;
5. the reduced-motion exception allowing restrained blink and speech mouth
   movement.

Platform support must be reviewed before every minor release. Removing a
previously supported platform requires a documented compatibility decision and
release note.

## Consequences

This matrix gives v1 meaningful Blink, Gecko, and WebKit coverage without
promising untested mobile and embedded environments. A lower-powered integrated
GPU makes the performance claim relevant to typical users, but may constrain
texture and deformation budgets. Safari testing requires macOS hardware in CI
or the release process. The rolling browser window also requires recording
exact tested versions for each release.

