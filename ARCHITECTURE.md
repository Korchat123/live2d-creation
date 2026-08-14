# Anatomy and renderer architecture

## 1. Coordinate system

- Logical canvas: `2048 × 2048`.
- Stored coordinates: normalized `[0, 1]` with pixel values derived for export.
- Origin: top-left; positive X right; positive Y down.
- Initial view: front-facing bust.
- All assets use the same canvas and registration version.

## 2. Transform hierarchy

```text
character.root
├── torso.root
│   ├── shoulder.left
│   ├── shoulder.right
│   ├── chest.center
│   ├── bust.left
│   ├── bust.right
│   ├── collar.center
│   └── outfit.root
└── neck.root
    └── head.root
        ├── head.crown
        ├── temple.left
        ├── temple.right
        ├── ear.left
        ├── ear.right
        ├── eye.left
        ├── eye.right
        ├── brow.left
        ├── brow.right
        ├── nose.center
        ├── mouth.center
        ├── chin.center
        ├── hair.back
        └── hair.front
```

Each node has a local transform relative to its parent. World transforms are calculated by matrix multiplication down the hierarchy. Assets never calculate their own unrelated global placement.

## 3. Parameter propagation

Anatomy parameters modify graph nodes and authored deformation regions:

- `head.width` affects the skull, temples, ears, eye spacing, hair opening, and jaw targets.
- `head.height` affects crown, eye line, nose, mouth, chin, and hair length origin.
- `jaw.width` and `jaw.length` affect the lower-face deformer and mouth target.
- `neck.width` and `neck.length` affect head attachment and collar opening.
- `shoulder.width` and `shoulder.slope` affect torso mesh, outfit shoulders, and hair/body occlusion.
- `torso.width` affects the covered body and garment torso regions.
- `bust.volume`, `bust.spacing`, and `bust.height` affect paired bust deformers and the outfit’s corresponding garment region.

Parameters are bounded by each base profile. Presets are collections of parameter values within those bounds.

## 4. Asset manifest contract

Every selectable asset must declare:

```json
{
  "schemaVersion": 1,
  "id": "hair-long-straight-v1",
  "category": "hair",
  "baseProfiles": ["standard-bust-v1"],
  "stylePack": "clean-anime-v1",
  "registrationVersion": "bust-front-v1",
  "layerContract": "hair-v1",
  "requiredSockets": ["head.crown", "temple.left", "temple.right", "hair.back", "hair.front"],
  "layers": [
    { "id": "hair.back", "path": "back.png", "parent": "hair.back", "z": 10 },
    { "id": "hair.front", "path": "front.png", "parent": "hair.front", "z": 70 }
  ],
  "sourceLandmarks": {},
  "colorMasks": {},
  "allowedParameterRanges": {}
}
```

Missing compatibility or landmark fields block selection. Shared canvas size alone is never treated as proof of fit.

## 5. Rendering

Use one renderer and one scene graph for stage and PNG export. SVG is the preferred first implementation because it provides inspectable transforms, masks, clipping, and deterministic serialization without a hidden duplicate renderer.

Scene nodes contain:

- transform matrix;
- asset/layer reference;
- parent socket;
- z-order;
- clip/mask references;
- color channels;
- visibility;
- optional deformation data.

PNG export clones the same SVG graph, embeds local image data, serializes it, and rasterizes it to the chosen output size.

## 6. Compatibility solver

Compatibility is a hard filter before placement:

1. base profile matches;
2. style pack matches;
3. registration version matches;
4. layer contract matches;
5. all required sockets exist;
6. source landmarks exist;
7. selected parameter values remain inside the asset’s safe ranges.

Placement then computes `parentWorldMatrix × assetAttachmentMatrix × userDeltaMatrix`.

Validation reports source-to-target residuals in canonical pixels. “Approved” requires measured thresholds and a reviewed golden screenshot.

## 7. Project structure for implementation

```text
src/
  app/
  character/
    anatomy-graph.ts
    parameters.ts
    compatibility.ts
    scene-graph.ts
  renderer/
    svg-renderer.ts
    png-export.ts
  ui/
    left-controls/
    center-stage/
    right-catalog/
assets/
  bases/standard-bust-v1/
  style-packs/clean-anime-v1/
schemas/
tests/
  unit/
  visual/
```

## 8. Testing strategy

- Unit tests for matrix propagation, parameter clamping, compatibility, and manifest validation.
- Contract tests ensuring every asset has required layers, masks, sockets, and landmarks.
- Visual snapshots for neutral anatomy and every selectable combination.
- Pixel-position tests for crown, eyes, nose, mouth, chin, neck, shoulders, collar, and hair opening.
- Browser tests at desktop, tablet, and phone widths.
- Export parity test comparing stage and exported rendering from the same scene state.

No large asset catalog is accepted before these tests protect the first coherent base.

## 9. Rig-ready art requirements

The canonical style pack must provide real separated source art rather than extracting visible fragments from a flattened illustration.

Required minimum layers:

- back hair mass, side locks, and front hair groups;
- face/ears and separate neck/body;
- left/right eye whites, irises, pupils, highlights, upper lashes, lower lashes, and brows;
- nose shading/line layer;
- closed mouth, open mouth interior, upper/lower lip lines, teeth, tongue, and vowel references;
- outfit back/front regions and collar pieces;
- optional accessories on explicit sockets.

Every deforming region includes painted bleed beyond its neutral visible edge. Masks and clipping relationships are authored and tested, not inferred from filenames.

For a true final model, the pipeline must also contain:

- mesh vertices and triangles;
- warp/rotation deformer hierarchy;
- parameter keyforms and ranges;
- draw-order and opacity behavior;
- clipping masks;
- physics groups;
- pose/expression data;
- a runtime-load validation test.
