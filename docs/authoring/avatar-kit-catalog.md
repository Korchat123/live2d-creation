# Anatomy-aware avatar-kit catalog

Status: first integrated starter catalog  
Updated: 2026-08-03

## Current default flow

Studio can now build a motion-ready Open Avatar without generating or
segmenting a full reference image:

1. parse the character prompt and art-style choice;
2. use the project seed to choose compatible saved body, face, paired-eye,
   mouth, and hair sets;
3. add requested optional saved sets such as cat ears, a tail, or a held prop;
4. recolor only declared iris and hair channels;
5. generate a new outfit over the selected neutral fitting body;
6. review the assembled outfit candidate, then create mask and expression
   artwork, save the project, and enable Motion Lab.

The same prompt, seed, style, and catalog revision produce the same selection.
Anatomy profiles prevent a saved eye, hairstyle, or garment from being combined
with incompatible attachment geometry.

## Starter catalog boundary

The first catalog is deliberately deterministic Canvas2D artwork. It provides
multiple body, face, eye, hair, and mouth choices; animal ears and
tails; accessories; and common cane, staff, wand, sword, spear, and umbrella
props. This makes the assembly, recoloring, alpha, storage, project, and Motion
Lab path testable without accepting unreviewed model output as a production
asset. The neutral body is a fitting guide, not an exportable outfit. The old
procedural outfit entries were removed because they did not match requested
silhouettes or generated art styles.

No generated ComfyUI or external-AI image was committed for this slice. Such an
image would need full-canvas registration, a declared anatomy profile,
recolor-channel masks, internal layer ownership, motion-extreme validation,
provenance, and rights evidence before catalog admission.

## Face-base catalog PDF review

The 15-page `Live2D Anime Face Base Catalog` supplied on 2026-08-03 is useful as
taxonomy, not as importable artwork. It identifies reusable design axes such as
oval, round, heart, square, and elongated faces; independent sclera, iris,
pupil, highlight, and lid roles; closed, half-open, and open mouth states; body
profiles; hair groups; animal features; and casual/fantasy clothing families.

Its generated contact sheets are intentionally not copied or cropped into the
catalog. They include labels and grid backgrounds, inconsistent registration
and scale, mixed front/back or close-up views, incomplete alpha separation, and
occasionally clothing on anatomy references. They also lack per-asset
provenance and motion-overlap evidence. New catalog artwork must be generated
or drawn as one registered set at a time and pass the normal review gates.

The clothing pages support the current outfit policy: terms such as blouse,
hoodie, sweater, skirt, trousers, dress, cape, robe, corset, and armor can guide
the project-local outfit prompt, but the garment is generated against the
selected body instead of being cropped from a contact sheet.

## Catalog-miss policy

Every outfit is marked `generate`. Its mask follows the selected torso and both
sleeves, and its prompt preserves the visible head, hair, hands, legs, pose, and
body anchors. Studio shows the neutral fitting suit as context but keeps Use
this avatar disabled until the generated outfit is reviewed. When a prompt
requests another set absent from saved data, the planner also marks that set as
`generate`. The
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

A 2026-08-03 fitted-outfit smoke test also completed technically but generated
a second, misregistered character and gray background around the fitting body.
The new minimum-garment and outside-mask-change gates reject this result instead
of enabling Use this avatar. The output remains outside the repository. A
ControlNet/pose-conditioned inpainting workflow or stronger garment-specific
model is still required for production-quality outfit generation.

## Verification

- unit tests cover deterministic selection, prompt recoloring, anatomy-profile
  rejection, catalog misses, catalog completeness, hostile metadata, and the
  bounded ComfyUI workflow;
- the browser test assembles saved anatomy for `cat girl with amber eyes and
long black hair wearing a hoodie`, confirms outfit generation is required,
  and verifies Motion Lab cannot be entered from the neutral fitting preview;
- the full Chromium, Firefox, and WebKit matrix passes; and
- repository CI covers formatting, lint, type checks, 142 tests, and builds.
