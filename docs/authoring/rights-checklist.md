# Asset rights checklist

Every image, font, texture, recording, generated asset, and visual reference must
have a rights record before it enters the reference avatar. A missing or
unverified record blocks export. Absence of a known restriction is not evidence
of permission.

## Current status

The reference avatar inventory contains three project-authored SVG studies and
is approved for its recorded uses. This approval does not cover uploaded
references, checkpoints, LoRAs, generated images, or future model projects.
Each generated project must carry its own complete evidence before export.

## Required record for each asset

- Repository-relative path and stable asset ID.
- Kind: image, font, texture, audio, generated asset, or reference.
- Source URL or source document; use `null` only while the item is blocked.
- Author or creator exactly as supported by evidence.
- Copyright owner exactly as supported by evidence.
- License name, license URL or bundled license file, and any attribution text.
- Modification summary, including conversion, cropping, tracing, or generation.
- Whether source use, modification, redistribution, and commercial use are each
  allowed. Unknown values must be `null`, never guessed.
- Evidence paths or URLs that a reviewer can inspect.
- Review status: `unresolved`, `approved`, or `rejected`, plus reviewer and date.

Do not label an asset original, public domain, or redistributable without
evidence. AI-generated assets also require the tool/provider, generation date,
input provenance, applicable terms, and a human review for third-party material.

## Generated-project evidence

A prompt-generated project must additionally record:

- generation provider and adapter version;
- workflow-template identifier and version;
- checkpoint/model identifier, version or hash, source, license, and evidence
  access date;
- every LoRA, embedding, control model, VAE, or other model dependency with the
  same evidence;
- prompt provenance without forcing private prompt text into a distributable
  bundle;
- seed and bounded generation settings needed for audit or reproduction;
- hashes of input references and generated artifacts;
- provider terms applicable on the generation date;
- whether commercial use and redistribution of the generated output are known
  to be allowed; and
- human review for copied signatures, watermarks, logos, characters, or other
  recognizable third-party material.

Studio may list a locally installed checkpoint before its rights record exists,
but it must label that checkpoint **unverified**. It may be used only for a
local candidate under an explicit warning. Accepting it into an exportable
project remains blocked until the evidence is approved. Studio must never
choose the first discovered checkpoint automatically.

## Addition procedure

1. Add or update the rights record before adding the asset.
2. Preserve a copy of license and permission evidence when redistribution
   permits it; otherwise link to the source and record the access date.
3. Run `pnpm rights:check`. Read `artifacts/rights-review.json`.
4. Resolve every validation error and every `unresolved` or `rejected` item.
5. Have a human reviewer compare the asset, record, and evidence. The asset
   author must not self-approve unsupported ownership claims.
6. Set the collection review to `approved` only when every asset is approved,
   evidence is present, and the explicit empty state is disabled.

## Review outcomes

- `incomplete`: valid inventory structure, but no export is allowed.
- `blocked`: at least one asset is unresolved, rejected, or lacks evidence.
- `approved`: all assets have evidence-backed permission for their intended
  source use, modification, redistribution, and commercial-use policy.

CI validates the inventory and uploads its review report. Structural CI success
does not mean the collection is approved; exporters must require
`exportEligible: true` from the validation result.
