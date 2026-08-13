import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import test from "node:test";

const styles = [
  "shojo-grace", "shonen-athletic", "chibi-pop", "bishonen-sleek", "seinen-heroic",
  "josei-elegant", "genki-compact", "idol-balanced", "fantasy-elfin", "retro-90s"
];
const genders = ["female", "male", "androgynous"];

const baseFolders = new Set([
  "facebase", "ears", "upper-body", "lower-body", "shoulders", "upper-arms", "elbows",
  "lower-arms", "wrists", "hands", "upper-legs", "knees", "lower-legs", "ankles", "feet", "other"
]);

function assertRgbaPng(image, label, expectedSize = [2048, 2048]) {
  assert.deepEqual(image.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), `${label} must be PNG`);
  assert.deepEqual([image.readUInt32BE(16), image.readUInt32BE(20)], expectedSize, `${label} dimensions`);
  assert.equal(image[25], 6, `${label} must use RGBA color`);
}

test("ten styles expose three gender variants with registered layers", async () => {
  for (const style of styles) {
    for (const gender of genders) {
      const root = new URL(`../assets/anatomy/${style}/${gender}/`, import.meta.url);
      const manifest = JSON.parse(await readFile(new URL("manifest.json", root), "utf8"));
      const entries = Object.entries(manifest.parts);
      const expectedFolders = new Set(baseFolders);
      if (gender === "female") expectedFolders.add("bust");

      assert.equal(manifest.profile, style);
      assert.equal(manifest.gender, gender);
      assert.deepEqual(manifest.canvas, [2048, 2048]);
      assert.equal(entries.length, gender === "female" ? 29 : 28, `${style}/${gender} layer count`);
      assert.deepEqual(new Set(entries.map(([name]) => name.split("/")[0])), expectedFolders);
      assert.equal(Object.hasOwn(manifest.parts, "bust/bust"), gender === "female");
      assert.equal(manifest.dressed_preview.hands, "hands/hands-registered.png");
      assertRgbaPng(
        await readFile(new URL(manifest.dressed_preview.hands, root)),
        `${style}/${gender} registered hands`
      );

      for (const [name, part] of entries) {
        assert.equal(part.crop.length, 4, `${style}/${gender}/${name} crop`);
        assert.ok(part.crop.every((value) => value >= 0 && value <= 2048), `${style}/${gender}/${name} crop bounds`);
        assert.deepEqual(part.offset, part.crop.slice(0, 2), `${style}/${gender}/${name} offset`);
        assert.deepEqual(part.size, [part.crop[2] - part.crop[0], part.crop[3] - part.crop[1]], `${style}/${gender}/${name} size`);
        const file = new URL(part.file, root);
        await access(file);
        assert.ok((await stat(file)).size > 100, `${style}/${gender}/${name} must not be empty`);
        assertRgbaPng(await readFile(file), `${style}/${gender}/${name}`, part.size);
      }

      assertRgbaPng(await readFile(new URL("source/source.png", root)), `${style}/${gender} source`);
    }
  }
});
