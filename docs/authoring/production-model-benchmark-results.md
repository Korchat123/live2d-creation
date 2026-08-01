# Animagine XL 4.0 Opt benchmark results

Decision: not approved for production prompt-only generation  
Completed: 2026-08-01

The fixed suite used `animagine-xl-4.0-opt.safetensors`, template
`open-avatar-concept-v1`, 1024 by 1024, batch size 1, Euler Ancestral, 28
steps, CFG 5, and one job at a time. All images and the temporary review sheet
remain outside the repository.

## Aggregate result

| Measure                                  | Result                                                    | Gate                      | Decision           |
| ---------------------------------------- | --------------------------------------------------------- | ------------------------- | ------------------ |
| Provider completion                      | 20/20, zero execution errors                              | No abandoned work         | Pass               |
| Consecutive hardware stability           | 20 completions, no OOM or frozen queue                    | At least 10               | Pass               |
| Runtime                                  | 32.88 s average; 36.16 s maximum                          | Record                    | Pass               |
| Exactly one visible subject              | 20/20 (100%)                                              | At least 80%              | Pass               |
| Complete head, hair, neck, and shoulders | 17/20 (85%)                                               | At least 90%              | **Fail**           |
| Watermark, signature, or generated text  | 0/20                                                      | None                      | Pass               |
| Large unrequested background object      | 1/20                                                      | None in an accepted image | Reject that sample |
| Severe anatomy failure                   | 1/20 (head absent)                                        | None in an accepted image | Reject that sample |
| Distinctive identity/palette compliance  | Repeated drift across hair, outfit color, and accessories | Review required           | **Fail**           |

The first seed reused ComfyUI's cached native-resolution smoke result, while
the remaining nineteen requests executed normally. Nineteen new executions
still exceed the ten-consecutive-job stability requirement.

## Per-artifact review

`Framing` scores only whether the full head, hair, neck, and shoulders are
visible. `Scene` fails for a large unrequested background object or severe
anatomy artifact. Identity notes capture visible drift and are not acceptance.

| Case | Seed  | Seconds     | Framing  | Scene    | Identity note                                                     | SHA-256                                                            |
| ---- | ----- | ----------- | -------- | -------- | ----------------------------------------------------------------- | ------------------------------------------------------------------ |
| 1    | 7     | 2.40 cached | Pass     | Pass     | Jacket rendered beige instead of navy.                            | `a86dcae5b3ae5d09d734a27e8024e4cfdc58da8c5b24914b743ff26c689e1d89` |
| 1    | 101   | 34.23       | Pass     | Pass     | Core hair, glasses, and navy outfit retained.                     | `24118acac7ce0eff760241f58f74af5cbcc3cde6cb262bec17c33ed77cace268` |
| 1    | 2027  | 34.21       | **Fail** | Pass     | Severe close crop; white coat dominates navy request.             | `da6d4cf7c1e17ecb17e707081b483dfa399b22cb817b25bcb72ffd2ab5f0b86a` |
| 1    | 65537 | 34.13       | Pass     | Pass     | Core hair, glasses, and navy outfit retained.                     | `499398e9a9ed5ad3a8296d03e6495b567bda3fa21e3fd2f3296ceb7fa84f2cd8` |
| 2    | 7     | 36.12       | Pass     | Pass     | Outfit rendered mostly white instead of dark.                     | `cb9d2fd1245b6288a99fe08112e00f7b844bf02e6a3670eae94b0a4498eb4eaa` |
| 2    | 101   | 34.11       | Pass     | Pass     | Dark uniform and gold star treatment retained.                    | `539e40e909b6ab8a84bd9f50163598c8de20c761e7ce07e8e664b23817cc55e9` |
| 2    | 2027  | 34.13       | Pass     | Pass     | Teal cloak drift, with requested dark/gold theme partly retained. | `38f13214d405e08c02265f66d1a47c27596ffccaac38feffcd808b270078a128` |
| 2    | 65537 | 34.11       | Pass     | **Fail** | Small star pins expanded into a large star behind the head.       | `0a507555fde2e40f83fa79f9e5d204a8ced79627d9185ed1c2e26f78bf4e1cc9` |
| 3    | 7     | 34.48       | Pass     | Pass     | Auburn/green/cream forest identity retained.                      | `6c0e6e75b052dd61906316e31a6fe4be5636a9e068d3244e05916cc182655e25` |
| 3    | 101   | 34.13       | Pass     | Pass     | Auburn/green/cream forest identity retained.                      | `9348e2efaeeca023dc877279bfe0d42b4657df980a4436098c8d10daa06e87fd` |
| 3    | 2027  | 34.08       | Pass     | Pass     | Hair shifted from auburn toward blonde.                           | `459f6444eced3e8c7e88b5b0858d96e7f1442b55e58aa40c1126cc8cc4b7e914` |
| 3    | 65537 | 34.16       | Pass     | Pass     | Auburn/green/cream forest identity retained.                      | `ac63806e1a57cb181290f1179ce6fdd6a241069b3cbb73f47af775e325a0bac8` |
| 4    | 7     | 36.14       | Pass     | Pass     | Blue jacket/scarf retained; braid and orange streak missing.      | `87cf762fdf7c3a8a8cd4571f87302ac02d8d55bc46979a4cbb4a9bbdc05f5b69` |
| 4    | 101   | 34.13       | Pass     | Pass     | Blue jacket/scarf retained; braid and orange streak missing.      | `017d147a688eb21d221bea0092b4e113506c7a95bf426305f5f89a96cd1ac948` |
| 4    | 2027  | 34.20       | Pass     | Pass     | Toolbox is relevant; braid, orange streak, and scarf drifted.     | `22801dd4c6c6b97ba7e31cea8d0296fcaf797bb20daad2c7bd5d3b639ad0e9f5` |
| 4    | 65537 | 34.18       | Pass     | Pass     | Blue jacket/scarf retained; braid and orange streak missing.      | `3537a5c78d8848850af2aa1c82bc0fce257fd047a55d77e8d9285f2f2b3f0258` |
| 5    | 7     | 36.16       | Pass     | Pass     | Burgundy outfit retained; hair became long instead of swept back. | `fcc1a59cbadef612cb0b98f8c3356470e0f8ce46d79e74260f983b055196390d` |
| 5    | 101   | 34.14       | Pass     | Pass     | Burgundy outfit retained; hair shifted from violet to red.        | `f2ab0cc1b7e4b06c92b4601b8d9bca73a551735ab39543d03e85fdfe7b97b790` |
| 5    | 2027  | 34.19       | **Fail** | Pass     | Severe close crop and hair identity drift.                        | `9a395e3ad585baf983d41800e3b12c58a9c815accc668237803d08a4f7a6cb81` |
| 5    | 65537 | 34.17       | **Fail** | **Fail** | Head absent; outfit remains but identity is unusable.             | `8f3ab4f875ebb3d2fad1f3ffdc88c443739bef9da97464fd7d107c73fd913103` |

## Decision and next control gate

Animagine XL 4.0 Opt is hardware-compatible on the reference RTX 3050, but
prompt-only composition and identity control are insufficient. Do not add it
to a production allowlist yet.

The next bounded experiment uses an application-owned pose/layout image with
the upstream `xinsir/controlnet-openpose-sdxl-1.0` candidate. Its model card
states Apache-2.0 and its published SafeTensors SHA-256 is
`b8524e557a7df60d081f5d4a0eb109967d107df217943bf88c2d99b9ebcc06c5`.
It is not yet downloaded or approved. The experiment must use ComfyUI's
built-in ControlNet nodes, without a third-party preprocessor or custom-node
installation.

Any new control model still requires exact-file hash verification, node
allowlist review, memory smoke, cancellation testing, and fixed-suite
comparison. The controlled workflow must reach at least 18/20 complete
framings, preserve distinctive requested features, and retain the
already-passed hardware and single-subject results before P3 begins.
Identity-reference conditioning for generated parts is a later, separate
approval after a concept exists; it must not be bundled into this composition
decision.
