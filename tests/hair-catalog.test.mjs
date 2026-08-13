import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import test from "node:test";

const styles = [
  "long-straight", "short-bob", "hime-cut", "high-ponytail", "twin-tails",
  "messy-ahoge", "double-bun", "side-braid", "wolf-cut", "long-wavy"
];

const standardParts = [
  "back-hair/back-left", "back-hair/back-center", "back-hair/back-right",
  "front-hair/front-left", "front-hair/front-center", "front-hair/front-right",
  "side-locks/side-lock-left", "side-locks/side-lock-right",
  "nape/nape-left", "nape/nape-right", "other/crown"
];

const extras = {
  "high-ponytail": ["ponytails/ponytail"],
  "twin-tails": ["twin-tails/twin-tail-left", "twin-tails/twin-tail-right"],
  "messy-ahoge": ["ahoge/ahoge"],
  "double-bun": ["buns/bun-left", "buns/bun-right"],
  "side-braid": ["braids/braid-left"]
};

function assertRgba2048(image, label) {
  assert.deepEqual(image.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), `${label} PNG`);
  assert.deepEqual([image.readUInt32BE(16), image.readUInt32BE(20)], [2048, 2048], `${label} size`);
  assert.equal(image[25], 6, `${label} RGBA`);
}

test("ten hairstyles expose registered standard and optional layers", async () => {
  for (const style of styles) {
    const root = new URL(`../assets/parts/hair/${style}/`, import.meta.url);
    const manifest = JSON.parse(await readFile(new URL("manifest.json", root), "utf8"));
    const required = [...standardParts, ...(extras[style] ?? [])];
    assert.equal(manifest.style, style);
    assert.deepEqual(manifest.canvas, [2048, 2048]);
    assert.deepEqual(new Set(Object.keys(manifest.parts)), new Set(required));
    assertRgba2048(await readFile(new URL(manifest.source, root)), `${style} source`);

    for (const [name, part] of Object.entries(manifest.parts)) {
      assert.equal(part.region.length, 4, `${style}/${name} region`);
      const file = new URL(part.file, root);
      await access(file);
      assert.ok((await stat(file)).size > 100, `${style}/${name} nonempty`);
      assertRgba2048(await readFile(file), `${style}/${name}`);
    }
  }
});
