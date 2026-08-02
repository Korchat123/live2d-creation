# Anatomy-aware avatar-kit catalog

Status: first integrated starter catalog  
Updated: 2026-08-02

## Current default flow

Studio can now build a motion-ready Open Avatar without generating or
segmenting a full reference image:

1. parse the character prompt and art-style choice;
2. use the project seed to choose compatible saved body, face, paired-eye,
   mouth, hair, and outfit sets;
3. add requested optional saved sets such as cat ears, a tail, or a held prop;
4. recolor only declared iris, hair, and outfit channels;
5. render every internal role on the shared `standard-front-v1` canvas;
6. create mask and expression artwork, validate/save the project, and enable
   Motion Lab.

The same prompt, seed, style, and catalog revision produce the same selection.
Anatomy profiles prevent a saved eye, hairstyle, or garment from being combined
with incompatible attachment geometry.

## Starter catalog boundary

The first catalog is deliberately deterministic Canvas2D artwork. It provides
multiple body, face, eye, hair, mouth, and outfit choices; animal ears and
tails; accessories; and common cane, staff, wand, sword, spear, and umbrella
props. This makes the assembly, recoloring, alpha, storage, project, and Motion
Lab path testable without accepting unreviewed model output as a production
asset.

No generated ComfyUI or external-AI image was committed for this slice. Such an
image would need full-canvas registration, a declared anatomy profile,
recolor-channel masks, internal layer ownership, motion-extreme validation,
provenance, and rights evidence before catalog admission.

## Catalog-miss policy

When a prompt requests a set absent from saved data, the planner marks only that
set as `generate`. Studio can still preview a compatible saved fallback. The
Generate missing sets action submits the assembled context and one bounded set
mask to the allowlisted ComfyUI workflow, extracts only changed pixels, and
shows the project-local candidate in assembled context. Rectangle/background
fills and broad prop-region changes are rejected. Choosing Use this avatar
accepts the candidate for that project; it does not create a reusable catalog
revision.

Generated catalog misses must never mutate already selected neighboring sets.
Failed geometry, alpha, identity/style, overlap, or motion checks keep the
candidate out of the saved library.

A physical Animagine test completed technically but failed visual review: the
checkpoint produced a character/contact-sheet composition instead of keeping
the generated cane inside the requested prop region. That output remains
outside the repository. Common props were added to the saved catalog so those
requests avoid the weak fallback. An unknown prop still requires a stronger
isolated-object model or workflow before it can pass production art review.

## Verification

- unit tests cover deterministic selection, prompt recoloring, anatomy-profile
  rejection, catalog misses, catalog completeness, hostile metadata, and the
  bounded ComfyUI workflow;
- the browser test assembles `cat girl with amber eyes and long black hair
wearing a hoodie` without ComfyUI, saves it, opens Motion Lab, and confirms
  the live preview;
- the full Chromium, Firefox, and WebKit matrix passes; and
- repository CI covers formatting, lint, type checks, 139 tests, and builds.
