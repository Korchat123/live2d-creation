# Phase B Vertical-Spike Performance Report

Status: automated build verified; physical GPU measurements pending  
Commit: recorded by CI at artifact time

## Automated evidence

- Schema, core, renderer, and Studio type-check and build together.
- Tests cover validation, deterministic animation, human override, renderer
  lifecycle ownership, and Studio adapter behavior.
- Studio reports frame duration from `requestAnimationFrame`.
- Renderer resolution is capped at 2x device-pixel ratio.
- The fixture has four small original SVG layers and one deformable 4 x 4 mesh.

## Required physical-browser run

| Measurement                            | Target                 | Result                        |
| -------------------------------------- | ---------------------- | ----------------------------- |
| Sustained frame rate                   | 60 FPS                 | Pending physical run          |
| P95 main-thread frame work at 1x DPR   | Below 12 ms            | Pending physical run          |
| Repeated mount/dispose retained growth | None                   | Pending browser profiler run  |
| WebGL context loss and restoration     | Stable recovery        | Pending browser run           |
| 1x and 2x DPR frame time               | Within approved budget | Pending browser run           |
| 30-minute CPU/GPU soak                 | No unbounded growth    | Deferred to release hardening |

No synthetic timing is presented as physical GPU evidence. CI may publish this
report and the built Studio preview, but pending labels remain until measurements
include browser, driver, power, thermal, and fixture details.
