import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import test from "node:test";

const styles = ["neutral-closed", "gentle-smile", "small-open", "wide-happy", "surprised-o", "frown", "teeth-smile", "tongue-smile"];

function assertRgba2048(image, label) {
  assert.deepEqual(image.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), `${label} PNG`);
  assert.deepEqual([image.readUInt32BE(16), image.readUInt32BE(20)], [2048, 2048], `${label} size`);
  assert.equal(image[25], 6, `${label} RGBA`);
}

test("eight mouths share one face registration and semantic draft layers", async () => {
  for (const style of styles) {
    const root = new URL(`../assets/parts/mouth/${style}/`, import.meta.url);
    const manifest = JSON.parse(await readFile(new URL("manifest.json", root), "utf8"));
    assert.equal(manifest.style, style);
    assert.deepEqual(manifest.canvas, [2048, 2048]);
    assert.deepEqual(manifest.registration, { target: "anime-neutral-v3", center: [1024, 1390] });
    assert.ok(Object.keys(manifest.parts).length >= 1);
    assertRgba2048(await readFile(new URL(manifest.source, root)), `${style} source`);
    for (const part of Object.values(manifest.parts)) {
      await access(new URL(part, root));
      assert.ok((await stat(new URL(part, root))).size > 100);
    }
  }
});
