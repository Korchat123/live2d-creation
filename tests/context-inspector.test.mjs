import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("right inspector exposes category-specific adjustment panels", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /id="context-controls"/);
  assert.match(html, /id="inspector-title"/);
  assert.match(html, /id="collection-hint"/);
  for (const category of ["base", "anatomy", "bust", "hair", "eyes", "mouth", "outfit", "preview"]) {
    assert.match(app, new RegExp(`${category}: \\[`), `${category} inspector copy`);
  }
  assert.match(app, /activeCategory === "hair".*hairMixerMarkup\(\)/s);
  assert.match(app, /activeCategory === "eyes".*eyeMixerMarkup\(\)/s);
  assert.match(app, /data-reset-parameters/);
});

test("hair and eye inputs are handled by the inspector", async () => {
  const app = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(app, /inspector\.addEventListener\("change"/);
  assert.match(app, /data-hair-style/);
  assert.match(app, /data-hair-addon/);
  assert.match(app, /data-hair-color/);
  assert.match(app, /data-eye-color/);
  assert.match(app, /eyeMaskPath\(style, channel\.id\)/);
  assert.match(app, /activeCategory === "eyes"/);
  assert.match(app, /character\.classList\.remove\("is-loading"\)/);
  assert.match(app, /partsSearch\.hidden = activeCategory === "preview"/);
});

test("desktop workspace is viewport-bound while side panels scroll", async () => {
  const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
  assert.match(styles, /\.app-shell \{ height: 100vh;[^}]*grid-template-rows: 72px minmax\(0, 1fr\) 36px;/);
  assert.match(styles, /\.parts-panel, \.inspector \{[^}]*overflow: auto;/);
  assert.match(styles, /@media \(max-width: 1050px\)[\s\S]*\.app-shell \{ height: auto;/);
});
