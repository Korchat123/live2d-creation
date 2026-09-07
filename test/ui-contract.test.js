import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const read = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("browser shell exposes controls, the real center SVG, and evidence inspector", async () => {
  const html = await read("index.html");
  assert.match(html, /class="panel controls-panel"/);
  assert.match(html, /id="stage"/);
  assert.match(html, /class="panel evidence-panel"/);
  assert.equal((html.match(/<svg /g) || []).length, 1);
  assert.match(html, /id="spec-version"/);
});

test("UI exposes the governing executable specification identity", async () => {
  const app = await read("src/app.js");
  assert.match(app, /specVersion\.textContent = SPEC_VERSION/);
  assert.match(app, /stage\.dataset\.specVersion = geometry\.specVersion/);
});

test("candidate contains no flattened image, decorative asset, canvas, or approval shortcut", async () => {
  const [html, app] = await Promise.all([read("index.html"), read("src/app.js")]);
  const implementation = `${html}\n${app}`;
  assert.doesNotMatch(implementation, /<img|<image|<canvas/i);
  assert.doesNotMatch(implementation, /Approved/);
  assert.match(implementation, /Actual computed geometry, not finished artwork/);
  const rootFiles = await readdir(new URL("../", import.meta.url), { recursive: true });
  assert.ok(!rootFiles.some(path => /\.(png|jpe?g|webp|psd|moc3|inp)$/i.test(path)), rootFiles.join(", "));
});

test("renderer marks construction primitives with canonical parent provenance", async () => {
  const app = await read("src/app.js");
  for (const parent of ["nose.center", "mouth.center"]) {
    assert.match(app, new RegExp(`data-parent=\\"${parent.replace(".", "\\.")}\\"`), parent);
  }
  assert.match(app, /data-parent="\$\{anatomy\.head\.parent\}" data-landmark-chain=/);
  assert.match(app, /data-parent="\$\{anatomy\.hairBack\.parent\}" data-landmark-chain=/);
  assert.match(app, /data-parent="\$\{anatomy\.hairFront\.parent\}" data-landmark-chain=/);
  assert.match(app, /data-parent="\$\{anatomy\.body\.parent\}" data-landmark-chain=/);
  assert.match(app, /data-layer="upper-arm-left" data-parent="\$\{anatomy\.arms\.left\.parent\}"/);
  assert.match(app, /data-layer="upper-arm-right" data-parent="\$\{anatomy\.arms\.right\.parent\}"/);
  assert.match(app, /data-layer="deltoid-left" data-parent="\$\{anatomy\.deltoids\.left\.parent\}"/);
  assert.match(app, /data-layer="deltoid-right" data-parent="\$\{anatomy\.deltoids\.right\.parent\}"/);
  assert.doesNotMatch(app, /resolved-body-outline|anatomy\.outline/);
  assert.doesNotMatch(app, /data-layer="axilla-cue-left"/);
  assert.match(app, /data-parent="\$\{anatomy\.chest\.parent\}" data-landmark-chain=/);
  assert.match(app, /data-parent="\$\{anatomy\.neckGuide\.parent\}" data-landmark-chain=/);
  assert.match(app, /ellipseMarkup\([^\n]+"eye\.left"\)/);
  assert.match(app, /ellipseMarkup\([^\n]+"eye\.right"\)/);
  assert.match(app, /clipPath id="eye-clip-left"/);
  assert.match(app, /clip-path="url\(#eye-clip-left\)"/);
  assert.match(app, /buildAnatomyPaths\(geometry\)/);
  assert.doesNotMatch(app, /const bustPath/);
  assert.match(app, /class="chest-field"/);
  assert.match(app, /class="chest-volume" data-layer="covered-torso-volume"/);
  assert.ok(app.indexOf('class="chest-volume"') < app.indexOf('${overlay}'), "covered torso volume must render by default, outside the optional Measurements overlay");
});

test("explicit hair back, ears, head, and hair front order preserves readable ears", async () => {
  const app = await read("src/app.js");
  const back = app.indexOf('data-layer="hair-back"');
  const ears = app.indexOf('data-layer="ears"');
  const head = app.indexOf('class="head" data-parent=');
  const front = app.indexOf('data-layer="hair-front"');
  assert.ok(back >= 0 && ears > back && head > ears && front > head, { back, ears, head, front });
  assert.match(app, /class="hair-front"[^>]+data-landmark-chain=/);
  assert.match(app, /class="ear"[^>]+data-landmark-chain=/);
});

test("semantic bust surfaces render in the declared attachment order", async () => {
  const app = await read("src/app.js");
  const arm = app.indexOf('data-layer="upper-arm-left"');
  const torso = app.indexOf('class="body" data-parent=');
  const deltoid = app.indexOf('data-layer="deltoid-left"');
  assert.ok(arm >= 0 && torso > arm && deltoid > torso, { arm, torso, deltoid });
  assert.doesNotMatch(app, /resolved-body-outline|data-layer="axilla-cue/);
});

test("measurement overlay keeps every point inspectable but labels a curated readable subset", async () => {
  const app = await read("src/app.js");
  assert.match(app, /data-landmark=/);
  assert.match(app, /<title>\$\{name\} · \$\{item\.parent\}/);
  assert.match(app, /const LABEL_LAYOUT = Object\.freeze/);
  assert.doesNotMatch(app, /item\.x \+ 9/);
  const overlay = app.indexOf("const overlay = overlayToggle.checked");
  const chestField = app.indexOf('data-layer="torso-deformation-field"');
  const renderedStage = app.indexOf("stage.innerHTML");
  assert.ok(overlay >= 0 && chestField > overlay && chestField < renderedStage, "deformation topology belongs to the optional measurement overlay");
});

test("responsive layout keeps the center stage first on phone-sized screens", async () => {
  const css = await read("styles.css");
  assert.match(css, /@media \(max-width: 720px\)/);
  assert.match(css, /\.stage-column \{ order: -1; min-height: 68vh; width: 100%; min-width: 0; max-width: 100%; \}/);
  assert.match(css, /\.stage-toolbar, \.stage-footer \{ flex-wrap: wrap;/);
  assert.match(css, /#stage \{ width: 100%; max-width: 100%; height: auto;/);
});
