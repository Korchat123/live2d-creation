import assert from "node:assert/strict";
import test from "node:test";

import { validateRights } from "../../tools/validate-rights.mjs";

const emptyManifest = {
  schemaVersion: 1,
  collection: "reference-avatar",
  review: { status: "incomplete" },
  emptyState: { declared: true },
  assets: [],
};

test("a truthful empty inventory is valid but export-blocked", () => {
  const result = validateRights(emptyManifest);
  assert.deepEqual(result.errors, []);
  assert.equal(result.exportEligible, false);
  assert.match(result.blockers.join("\n"), /No assets exist/u);
});

test("unresolved rights can never become export eligible", () => {
  const result = validateRights({
    ...emptyManifest,
    review: { status: "approved" },
    emptyState: { declared: false },
    assets: [
      {
        id: "unknown",
        path: "asset.png",
        kind: "image",
        source: null,
        author: null,
        copyrightOwner: null,
        license: null,
        modifications: [],
        permissions: {
          sourceUse: null,
          modification: null,
          redistribution: null,
          commercialUse: null,
        },
        evidence: [],
        review: { status: "unresolved" },
      },
    ],
  });

  assert.deepEqual(result.errors, []);
  assert.equal(result.exportEligible, false);
  assert.match(result.blockers.join("\n"), /not approved/u);
});
