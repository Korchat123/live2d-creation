# One-click prompt-to-avatar physical smoke

Result: passed  
Completed: 2026-08-01  
Reference device: NVIDIA GeForce RTX 3050 6 GB Laptop GPU

## User-visible actions

1. Enter one prompt.
2. Choose **Generate Live2D avatar** once.

No character-bible, landmark, candidate-acceptance, mask-painting, or Portrait
Layer Lab interaction was performed.

## Prompt

`original anime cat girl with long black hair streaked blue, amber eyes, cat hoodie jacket, white mini skirt`

## Result

- The controlled concept, automatic segmentation, generated part repair, mouth
  state, blink, left wink, and right wink completed sequentially.
- Empty SAM results for some eyebrow and mouth roles used bounded automatic
  regions before generated-art repair. They did not require manual input.
- The complete run took approximately 17 minutes on the reference device.
- The project persisted through IndexedDB and downloaded successfully.
- Downloaded bytes: `8,307,631`.
- SHA-256:
  `132111234215dd6f3db374dd4cd927ef4ea44ede0a7f19d7788e5ac12f7b2dde`.
- Transparent mask layers: `24`.
- Generated artwork entries: `24`.
- Generated expression states: `4`.
- Missing artwork entries: `0`.

The generated file remains outside the repository at
`C:\Users\korch\AppData\Local\Temp\cat-girl.open-avatar-project.json`.

This proves the local one-click Open Avatar draft path. It does not relabel the
automatic output as an Editor-exported Live2D Cubism model, and it does not
override the documented art-quality and release gates.
