# Anime Character Creator — clean restart

This repository has been intentionally reset. The previous application, generated assets, screenshots, dependencies, and renderer were deleted because unrelated PNG parts could not produce a coherent character.

No application is implemented yet. Planning and the anatomy/asset contract come first.

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

Planning baseline only. The first implementation milestone is a debug-visible canonical bust anatomy with no decorative art.
