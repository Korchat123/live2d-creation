# Human anime anatomy kits

Ten art styles share a 2048 × 2048 full-canvas registration system. Every style contains `female`, `male`, and `androgynous` adult human anime variants in a neutral T-pose, wearing a simple opaque pose-reference suit. The silhouettes use organic anatomy—never robot armor, mechanical panels, or ball joints.

## Kits

- `shojo-grace` — long, delicate shojo proportions
- `shonen-athletic` — balanced athletic shonen proportions
- `chibi-pop` — compact adult super-deformed proportions
- `bishonen-sleek` — tall, narrow bishonen proportions
- `seinen-heroic` — broad heroic seinen proportions
- `josei-elegant` — mature, softly shaped josei proportions
- `genki-compact` — short, energetic athletic proportions
- `idol-balanced` — polished, balanced idol proportions
- `fantasy-elfin` — slender fantasy proportions with pointed ears
- `retro-90s` — elongated 1990s anime proportions

## Part folders and count

Each male and androgynous kit contains 28 registered layers. Female kits contain 29:

- 1 `facebase`
- 2 `ears`
- 1 `upper-body` and 1 `lower-body`
- 2 `shoulders`
- 2 `upper-arms`, 2 `elbows`, 2 `lower-arms`, 2 `wrists`, and 2 `hands`
- 2 `upper-legs`, 2 `knees`, 2 `lower-legs`, 2 `ankles`, and 2 `feet`
- 1 `other/neck`
- 1 female-only `bust/bust` overlay, cropped from the covered chest for independent Live2D motion

Paired parts use `left` and `right` from the character's perspective. Part PNGs are tightly cropped to keep the repository manageable; every manifest records the original 2048 × 2048 canvas plus each part's `offset`, `size`, and source `crop`, so a PSD/export step can reconstruct exact registration. Crop regions overlap around each joint so the eventual ArtMeshes can deform or use Glue without exposing empty seams.

Recommended deformer chain:

```text
lower-body
├─ upper-body ─ neck ─ facebase ─ ears
├─ shoulder ─ upper-arm ─ elbow ─ lower-arm ─ wrist ─ hand
└─ upper-leg ─ knee ─ lower-leg ─ ankle ─ foot
```

Each style uses the hierarchy `assets/anatomy/<style>/<gender>/...`. Gender here describes the supplied body silhouette, not character identity; users can combine it with any compatible face, hair, outfit, chest layer, or presentation.

Adjustable covered bust art is stored independently under `assets/parts/bust/<style>/`. Every style provides registered left and right layers plus a combined thumbnail. This separation supports bounded volume, spacing, and height parameters without tying the chest choice to a body gender.

Matching face bases live under `assets/parts/face-base/<style>/<gender>.png`. The preview separates upper-head and lower-jaw deformation regions and limits overall scale, head width, jaw width, and jaw length to the ranges in `assets/parts/adjustment-contract.json`.

These generated assets are anime anatomy drafts, not rig-ready Live2D meshes. The rectangular source crops establish naming and registration, but production assets still need manually painted underlaps, clean masks, and ArtMesh review at every moving joint. The female bust overlay is fully clothed and intentionally non-explicit.
