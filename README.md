# Live2D Parts Studio

An early, dependency-free UI outline for assembling a character from prepared visual parts.

## Run locally

Start the local preview server, then open `http://localhost:4173`:

```sh
corepack pnpm run dev
```

The current prototype does not load or export Live2D files.

The Anatomy category contains ten Japanese-anime human proportion styles with female, male, and androgynous variants—30 kits total. Male and androgynous kits have 28 registered layers; female kits add a covered bust-motion layer for 29. See [assets/anatomy/README.md](assets/anatomy/README.md).

The composer also exposes independent style-matched covered bust layers and matching face bases. Sliders adjust bust volume/spacing/height and face scale/head width/jaw width/jaw length inside art-safe limits, with a one-click defaults reset.

The Hair category contains ten registered anime hairstyles. Every style is separated into back, front-left/center/right, side-lock, nape, and crown layers, with optional ahoge, bun, braid, ponytail, and twin-tail layers where applicable. See [assets/parts/hair/README.md](assets/parts/hair/README.md).

Eyes and Outfit are now active categories with ten choices each. A dedicated Final Preview assembles the outfit, anatomy-matched hands, registered head, eyes, and hair without exposing duplicate body limbs beneath the clothes. Layer details are documented in [assets/parts/eyes/README.md](assets/parts/eyes/README.md) and [assets/parts/outfits/README.md](assets/parts/outfits/README.md).

## Verify

```sh
corepack pnpm run ci
```

See [PROJECT_PLAN.md](PROJECT_PLAN.md) for scope and sequencing.
