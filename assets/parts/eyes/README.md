# Anime eye catalog

Ten registered anime eye styles align with `anime-neutral-v3`. Each style keeps an assembled transparent source plus 14 full-canvas deformation drafts:

- left/right eyebrows
- left/right eye whites
- left/right irises
- left/right pupils
- left/right highlights
- left/right upper lashes
- left/right lower lashes

The geometric regions intentionally overlap. In Cubism, replace these draft masks with clean painted sclera, iris, pupil, highlight, and lash ArtMeshes before adding blink, smile-eye, and gaze parameters.

Each style also includes precise `color-masks/sclera.png`, `iris.png`, and `pupil.png` layers. The studio uses these masks to change eye-white, iris, and pupil colors independently without recoloring lashes or highlights.
