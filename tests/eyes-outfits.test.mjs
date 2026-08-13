import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import test from "node:test";

const eyes = ["classic-blue", "soft-brown", "sharp-red", "sleepy-violet", "round-green", "golden-cat", "heterochromia", "monochrome-gray", "magical-star", "mature-narrow"];
const outfits = ["academy-blazer", "sailor-uniform", "oversized-hoodie", "gothic-dress", "idol-stage", "fantasy-mage", "cyber-street", "modern-yukata", "formal-suit", "sporty-jacket"];

function assertRgba2048(image, label) {
  assert.deepEqual(image.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), `${label} PNG`);
  assert.deepEqual([image.readUInt32BE(16), image.readUInt32BE(20)], [2048, 2048], `${label} size`);
  assert.equal(image[25], 6, `${label} RGBA`);
}

async function verifyCatalog(rootName, styles, expectedParts) {
  for (const style of styles) {
    const root = new URL(`../assets/parts/${rootName}/${style}/`, import.meta.url);
    const manifest = JSON.parse(await readFile(new URL("manifest.json", root), "utf8"));
    assert.equal(manifest.style, style);
    assert.deepEqual(manifest.canvas, [2048, 2048]);
    if (rootName === "eyes") {
      assert.deepEqual(manifest.registration, {
        target: "anime-neutral-v3",
        face_scale: 0.58,
        origin: [0.5, 0.5],
        inward_shift: 100
      });
    }
    assert.equal(Object.keys(manifest.parts).length, expectedParts, `${rootName}/${style} parts`);
    assertRgba2048(await readFile(new URL(manifest.source, root)), `${rootName}/${style} source`);
    for (const [name, part] of Object.entries(manifest.parts)) {
      const file = new URL(part.file, root);
      await access(file);
      assert.ok((await stat(file)).size > 100, `${rootName}/${style}/${name} nonempty`);
      assertRgba2048(await readFile(file), `${rootName}/${style}/${name}`);
    }
  }
}

test("ten eye styles expose fourteen registered facial layers", async () => {
  await verifyCatalog("eyes", eyes, 14);
});

test("ten outfits expose thirteen registered garment regions", async () => {
  await verifyCatalog("outfits", outfits, 13);
});
