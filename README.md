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

The Hair category contains ten registered anime hairstyles. Back and front styles can be mixed independently; users can combine ahoge, buns, braid, ponytail, and twin-tail add-ons and choose a shared hair color. See [assets/parts/hair/README.md](assets/parts/hair/README.md).

Eyes and Outfit are now active categories with ten choices each. Eye-white, iris, and pupil colors are independently adjustable. A dedicated Final Preview assembles the outfit, anatomy-matched hands, registered head, eyes, and mixed hair without exposing duplicate body limbs beneath the clothes. Layer details are documented in [assets/parts/eyes/README.md](assets/parts/eyes/README.md) and [assets/parts/outfits/README.md](assets/parts/outfits/README.md).

Mouth provides eight registered expressions with independent width, height, and vertical-position fitting. Semantic mouth layers are documented in [assets/parts/mouth/README.md](assets/parts/mouth/README.md).

The right inspector follows the active category: Face and Bust show bounded shape sliders, Hair shows its layer mixer, Eyes shows color channels, and Anatomy/Outfit show the selected asset details. Clicking any current-layer row opens that category and its controls.

## Verify

```sh
corepack pnpm run ci
```

See [PROJECT_PLAN.md](PROJECT_PLAN.md) for scope and sequencing.
