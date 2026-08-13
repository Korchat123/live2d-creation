# Anime hair catalog

Ten opaque Japanese-anime hairstyles share the approved face-base registration. Each style keeps its assembled transparent source under `source/source.png` and exposes full-canvas semantic draft layers through `manifest.json`.

## Styles

- `long-straight`
- `short-bob`
- `hime-cut`
- `high-ponytail`
- `twin-tails`
- `messy-ahoge`
- `double-bun`
- `side-braid`
- `wolf-cut`
- `long-wavy`

## Standard layers

- `back-hair/back-left`, `back-center`, and `back-right`
- `front-hair/front-left`, `front-center`, and `front-right`
- `side-locks/side-lock-left` and `side-lock-right`
- `nape/nape-left` and `nape-right`
- `other/crown`

Styles add semantic extras only when present:

- `ahoge/ahoge`
- `buns/bun-left` and `bun-right`
- `braids/braid-left`
- `ponytails/ponytail`
- `twin-tails/twin-tail-left` and `twin-tail-right`

Suggested draw order is back hair and tails behind the face, then the face, followed by side locks, front hair, crown details, ahoge, and accessories. These generated separations use overlapping feathered regions so they are suitable as registration and rig-planning drafts, not final Cubism ArtMeshes. Repaint occluded roots and overlap margins before production deformation.
