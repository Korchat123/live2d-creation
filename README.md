# Anime Character Creator — clean restart

This repository has been intentionally reset. The previous application, generated assets, screenshots, dependencies, and renderer were deleted because unrelated PNG parts could not produce a coherent character.

The production character creator is not implemented yet. The current browser application is deliberately limited to executable construction geometry for the first anatomy gate.

Read [PRODUCT_PLAN.md](./PRODUCT_PLAN.md) for product scope and UI behavior, [ARCHITECTURE.md](./ARCHITECTURE.md) for the anatomy graph, asset contract, renderer, and validation rules, [MULTI_AGENT_PLAN.md](./MULTI_AGENT_PLAN.md) for independent ownership and evaluator vetoes, and [VERSION_CONTROL.md](./VERSION_CONTROL.md) plus [FEATURE_TRACKER.md](./FEATURE_TRACKER.md) for mandatory branch, commit, push, review, merge, and release tracking.

## Product statement

Build a polished bust-up anime character creator that behaves like a game character designer:

- the center always shows the real composed result;
- the left panel edits anatomy, proportions, colors, gender presentation, and art style;
- the right panel selects only parts proven compatible with the active anatomy and style pack;
- every attached part follows named anatomy sockets and parent transforms;
- preview and export use the same render graph;
- the app exports honest layered artwork for rigging before claiming Live2D/Inochi model support.

## Current status

`P0-A` is an executable **geometry-only Gate A candidate** for `standard-bust-v1/spec-0.3.0`. It renders calculated construction geometry, landmarks, ratios, parameter bounds, exhaustive evidence states, and deliberately invalid rejection fixtures. `src/spec.js` is the single executable source for parameters, ranges, constants, and presets used by controls, geometry, validation, and tests. The candidate contains no decorative character artwork, hair/outfit assets, generated finished image, or rig.

Valid automated results deliberately say `Needs review`, never `Approved`. An independent evaluator must review the pushed candidate before Gate A can pass.

## Run the geometry candidate

Requires Node.js 20 or newer. There are no package dependencies or install step.

```powershell
npm run start
```

Open `http://localhost:4173`.

## Run tests

```powershell
npm test
```

The suite covers the character-bible ratios, landmark ordering, symmetry, parameter bounds, all presets, all individual min/max states, every pairwise four-corner extreme, deterministic output, canonical ownership, absence of per-part global positioning, propagation, and all eight mandatory rejection fixtures.

Run the real Chromium responsive check separately:

```powershell
npm run test:browser
```

It emulates a `390 x 844` viewport and asserts that the page has no horizontal overflow, the SVG remains centered and contained, both acromia remain visible, toolbar controls stay inside the viewport, and measurement labels default off on phones.
