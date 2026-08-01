# Controlled SDXL composition benchmark

Decision: not approved for production; framing passes, strict scene gate fails  
Completed: 2026-08-01

## Verified inputs

- Concept checkpoint: `animagine-xl-4.0-opt.safetensors` (the separately
  recorded production-model benchmark identifies and verifies this file).
- Composition model:
  `xinsir-controlnet-openpose-sdxl-1.0.safetensors`.
- Composition-model bytes: `2,502,139,104`.
- Composition-model SHA-256:
  `b8524e557a7df60d081f5d4a0eb109967d107df217943bf88c2d99b9ebcc06c5`.
- The local hash exactly matched the publisher's stated file hash.
- Pose template: application-owned `open-avatar-openpose-v1`, rendered at
  1024 by 1024. No pose preprocessor or additional custom node was installed.
- Reviewed built-in nodes added to the private allowlist: `LoadImage`,
  `ControlNetLoader`, and `ControlNetApplyAdvanced`.
- Batch size one, 1024 by 1024, 28 Euler Ancestral steps, CFG 5, four fixed
  seeds across five fixed character requests.

All generated images and temporary contact sheets remain outside the
repository.

## Results

| Run                    | Completion | Average / maximum runtime  | Complete framing | Scene result                                                                 | Decision |
| ---------------------- | ---------- | -------------------------- | ---------------- | ---------------------------------------------------------------------------- | -------- |
| Prompt-only baseline   | 20/20      | 32.88 / 36.16 seconds      | 17/20            | One background object and one severe failure                                 | Fail     |
| Control 0.85, end 0.85 | 20/20      | approximately 50.7 seconds | 18/20            | Three visible halo, starburst, or graphic-background failures                | Fail     |
| Control 0.75, end 0.75 | 20/20      | 48.13 / 55.77 seconds      | 19/20            | One halo, one faint panel/background treatment, and one top-cropped mechanic | Fail     |

The final run materially improved composition and requested feature retention.
It preserved all of the librarian's core glasses/eye treatment, consistently
preserved silver hair and star motifs for the astronomer, preserved three of
four auburn courier identities, consistently produced the mechanic's orange
streak and coveralls, and preserved violet/burgundy magician identity. Color,
hair-length, and exact outfit details still drift across seeds.

The 19/20 framing result exceeds the 18/20 framing threshold and 40 consecutive
controlled jobs completed without an out-of-memory error or abandoned queue.
The workflow is still not production-approved because the gate also forbids
unrequested background objects and severe crops. P3 additionally requires an
explicitly accepted concept and a separate identity-conditioning review.

## Final-run artifact evidence

| Case | Seed  | Bytes   | SHA-256                                                            | Visual review                                       |
| ---- | ----- | ------- | ------------------------------------------------------------------ | --------------------------------------------------- |
| 1    | 7     | 488,964 | `96ff4800e3000c2177ae909d58854b651143ebc141b3f07d7fec4abd3acc99d4` | Pass framing; hair shifted green.                   |
| 1    | 101   | 412,129 | `30e14fcfc4ca7ebded97feceb2297dca19cb315b903e9dad0416ed0f2e964598` | Pass framing; strongest librarian identity.         |
| 1    | 2027  | 442,445 | `457dea8bb2e962573cac7cf78bbdfd409a875e3cde678f5f3e89ce1494945515` | Pass framing; pale hair and faint panel lines.      |
| 1    | 65537 | 341,764 | `062229ac286b7d892cd0048d85ca3c41e2e4585e0f470e0da34aba59d46f68f2` | Pass framing; blue/teal hair retained.              |
| 2    | 7     | 360,965 | `081361d3ceaef22c440f5541ff8685f0edd05799eb6da4cf705e363d2711b4b4` | Pass framing; outfit rendered mostly white.         |
| 2    | 101   | 391,288 | `e48769751006843f2147dbbe195dc16d5fddfd2fc3932a59c059f21149e054d6` | Pass framing; navy and gold retained.               |
| 2    | 2027  | 332,642 | `40632f21d50231e8d91b582b6bcf25c2492f3f7858c7d23dd130c7ffd491dbaa` | Pass framing; white coat drift.                     |
| 2    | 65537 | 483,913 | `f0502bc815aa0a3427d6a7023336e2d3d38ea43a24857f76d467b462c5ac2a0a` | Pass framing; reject unrequested halo.              |
| 3    | 7     | 429,046 | `792f86c97ce41c6c26a48d1294023fe7a6f9ff12b8c2fb43559c15b84f123f9d` | Pass framing and courier identity.                  |
| 3    | 101   | 438,215 | `eea16e1607bbef426cce40189ebaa1d7753d57bb1e34419c5b4793bba28821a6` | Pass framing and courier identity.                  |
| 3    | 2027  | 375,981 | `c165e1ec9387ce9cd18c5519d474c0429ab56135f241a0a604d65e6ba5f2dd57` | Pass framing; hair shifted green.                   |
| 3    | 65537 | 383,549 | `6b1cd799a3c72d1b52c68b4915c58d830297862a0d43333b25f730606dbe3d4e` | Pass framing and courier identity.                  |
| 4    | 7     | 518,945 | `bd1c27b3ae0b1e131720db55e2425ff829c2ac2f46544ed0c37149652e08a6c7` | Pass framing; orange streak and coveralls retained. |
| 4    | 101   | 357,928 | `2c067b765ee320692984de386a16fc8763f9e7ed917066210f96566d8a835dc7` | Pass framing; strongest mechanic identity.          |
| 4    | 2027  | 452,631 | `627dbb867719f8dce4f7e00a612ab77f34782456f9e65a92989f59761d6e9450` | **Fail:** top of head and hair cropped.             |
| 4    | 65537 | 321,389 | `62d887577ba81cf3bbede654911dab635281ce3fdf043bb7711431c7b88a6160` | Pass framing; orange streak and coveralls retained. |
| 5    | 7     | 583,351 | `4fd6079650429d84f5acd0debec38e2258307a76255fe9fa9f9d83671f173693` | Pass framing; hair rendered long.                   |
| 5    | 101   | 702,825 | `3008b399b9811a602484d45f7db7a9cb9223661e8e59bff9cc6ea9297107c73f` | Pass framing and palette.                           |
| 5    | 2027  | 484,978 | `505a20a61e1e93629632d0ee618a572ce8647e6067907050efe8562e258f38c6` | Pass framing and palette.                           |
| 5    | 65537 | 580,469 | `5fd02638f658ff0f98bec760375761c0e4e97693a46b264de1828a18625455af` | Pass framing and palette.                           |

## Remaining recovery path

Do not keep tuning the same pose-only graph indefinitely. The next review
should evaluate a bounded post-generation subject/background validator and a
separately rights-reviewed identity-reference adapter. Any new model or custom
node requires source, license, exact-file hash, node-contract, memory, hostile
input, cancellation, and fixed-suite evidence before it can affect accepted
project art.
