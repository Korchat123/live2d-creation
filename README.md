# Live2D Anime Character Studio

An interactive 60 FPS Live2D anime character composer with real-time physics, gaze tracking, auto-blinking, expression morphing, high-res PNG export, and Live2D Cubism model JSON manifest generation.

## Run locally

Start the local studio preview server, then open `http://localhost:4173`:

```sh
node tools/serve.mjs
```

## Features

- **60 FPS Live2D Physics Engine:** Real-time mouse gaze tracking (`ParamEyeBallX`, `ParamEyeBallY`), 2.5D head rotation (`ParamAngleX`, `ParamAngleY`, `ParamAngleZ`), procedural sine breathing (`ParamBreath`), and automatic anime eye blinking.
- **Human Anime Aesthetics:** Natural arm/hand posture, procedural anime eyebrows, nose bridge/tip line, warm cheek blush gradients, and pupil gloss shine.
- **Preset Characters:** One-click loaders for *Idol Girl*, *Shonen Hero*, *Gothic Lolita*, and *Cyberpunk*.
- **Live Expression Triggers:** Smile (Neutral), Happy 😊, Wink 😉, Surprised 😮, Shy / Blush 😳, and Angry 😤.
- **Studio Backdrops:** Studio Light, Classroom Day, Golden Sunset, Cyberpunk Neon, and Transparent BG.
- **Export System:** High-resolution PNG image export, Live2D model JSON manifest export, and character preset JSON file save/load.

## Catalogs & Layers

- **Anatomy:** Ten Japanese-anime human proportion styles with female, male, and androgynous variants (30 kits total). Male and androgynous kits have 28 registered layers; female kits add a covered bust-motion layer. See [assets/anatomy/README.md](assets/anatomy/README.md).
- **Hair:** Ten registered anime hairstyles with mixable back/front layers, hair color picker, and ahoge/bun/braid add-ons. See [assets/parts/hair/README.md](assets/parts/hair/README.md).
- **Eyes & Outfit:** Ten eye styles with independent sclera, iris, and pupil color customization. Ten registered outfit garments. See [assets/parts/eyes/README.md](assets/parts/eyes/README.md) and [assets/parts/outfits/README.md](assets/parts/outfits/README.md).
- **Mouth:** Eight registered mouth expressions with height, width, and position fitting. See [assets/parts/mouth/README.md](assets/parts/mouth/README.md).

## Verify

```sh
node --test
```

See [PROJECT_EVALUATION.md](PROJECT_EVALUATION.md) and [PROJECT_PLAN.md](PROJECT_PLAN.md) for architecture standards and roadmap.
