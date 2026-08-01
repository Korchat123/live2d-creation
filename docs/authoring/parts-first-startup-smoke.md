# Strict parts-first startup smoke

Status: startup path passed; full reconstruction pending  
Date: 2026-08-01  
Device: Windows 11, NVIDIA RTX 3050 Laptop GPU, local ComfyUI

The browser submitted a simple blue-haired character prompt through the default
one-click flow. Studio kept the complete-character preview hidden, displayed
the explicit parts-first provenance message, generated back hair as job 1, and
advanced directly to torso as job 2 of 30.

No new `open-avatar-concept` artifact was written. The most recent concept file
remained `open-avatar-concept_00015_.png` from 18:30, before this implementation
existed. The only completed generation artifact from the smoke was the first
part workflow output at 19:20. The second job was deliberately interrupted and
the ComfyUI queue returned to zero running and zero pending jobs.

The raw diffusion frame contained a gray field around the requested hair. This
is not accepted artwork. The pipeline now runs part-specific SAM isolation on
each newly generated part before storing its full-canvas transparent layer;
bounded image-difference extraction is retained only as a fallback. This is
self-cleanup of a purpose-generated part, not segmentation or cropping of a
complete portrait.

A complete labelled run is still required to judge identity consistency,
layer edges, dependency composition, expressions, and final visual quality.
