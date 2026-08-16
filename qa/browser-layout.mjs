import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const chromiumPaths = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
];
const chromePath = chromiumPaths.find(existsSync);
const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

async function waitFor(check, label, attempts = 80) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const value = await check();
      if (value) return value;
    } catch {}
    await delay(100);
  }
  throw new Error(`Timed out waiting for ${label}`);
}

function connectCdp(url) {
  const socket = new WebSocket(url);
  const pending = new Map();
  let nextId = 0;
  socket.addEventListener("message", async event => {
    const data = typeof event.data === "string" ? event.data : event.data instanceof Blob ? await event.data.text() : new TextDecoder().decode(event.data);
    const message = JSON.parse(data);
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  });
  socket.addEventListener("close", event => {
    for (const { reject } of pending.values()) reject(new Error(`CDP socket closed: ${event.code}`));
    pending.clear();
  });
  const ready = new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  return {
    ready,
    close: () => socket.close(),
    call: (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++nextId;
      const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 5000);
      pending.set(id, {
        resolve: value => { clearTimeout(timeout); resolve(value); },
        reject: error => { clearTimeout(timeout); reject(error); }
      });
      socket.send(JSON.stringify({ id, method, params }));
    })
  };
}

test("real Chromium keeps a 390px stage centered, contained, and anatomically visible", { skip: !chromePath, timeout: 30000 }, async t => {
  const root = new URL("../", import.meta.url).pathname.slice(1);
  const server = spawn(process.execPath, ["server.mjs"], { cwd: root, env: { ...process.env, PORT: "4197" }, stdio: "ignore", windowsHide: true });
  const profile = await mkdtemp(join(tmpdir(), "p0-layout-chrome-"));
  const chrome = spawn(chromePath, ["--headless=new", "--no-sandbox", "--disable-gpu", "--disable-software-rasterizer", "--disable-features=Vulkan,UseSkiaRenderer", "--hide-scrollbars", "--no-first-run", "--remote-allow-origins=*", `--user-data-dir=${profile}`, "--remote-debugging-port=0", "about:blank"], { stdio: "ignore", windowsHide: true });
  t.after(() => { server.kill(); chrome.kill(); });

  await waitFor(async () => (await fetch("http://127.0.0.1:4197/")).ok, "geometry server");
  const debugPort = await waitFor(async () => Number((await readFile(join(profile, "DevToolsActivePort"), "utf8")).split(/\r?\n/)[0]), "Chrome debugging port");
  const pages = await waitFor(async () => {
    const result = await fetch(`http://127.0.0.1:${debugPort}/json`);
    return result.ok ? result.json() : null;
  }, "Chrome page");
  const cdp = connectCdp(pages.find(page => page.type === "page").webSocketDebuggerUrl);
  await cdp.ready;
  t.after(() => cdp.close());
  await cdp.call("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await cdp.call("Page.navigate", { url: "http://127.0.0.1:4197/" });
  await waitFor(async () => {
    const result = await cdp.call("Runtime.evaluate", { expression: "document.readyState === 'complete' && !!document.querySelector('#stage path')", returnByValue: true });
    return result.result.value;
  }, "rendered stage");

  const evaluation = await cdp.call("Runtime.evaluate", {
    returnByValue: true,
    expression: `(() => {
      const stage = document.querySelector('#stage');
      const rect = stage.getBoundingClientRect();
      const point = (x, y) => {
        const value = stage.createSVGPoint(); value.x = x; value.y = y;
        return value.matrixTransform(stage.getScreenCTM());
      };
      const center = point(500, 500);
      const left = point(Number(stage.dataset.acromionLeftX), Number(stage.dataset.acromionY));
      const right = point(Number(stage.dataset.acromionRightX), Number(stage.dataset.acromionY));
      const toggle = document.querySelector('.overlay-toggle').getBoundingClientRect();
      return {
        innerWidth,
        documentScrollWidth: document.documentElement.scrollWidth,
        bodyScrollWidth: document.body.scrollWidth,
        rect: { left: rect.left, right: rect.right, width: rect.width },
        centerX: center.x,
        acromionLeftX: left.x,
        acromionRightX: right.x,
        toggleRight: toggle.right,
        overlayChecked: document.querySelector('#overlay-toggle').checked
      };
    })()`
  });
  const layout = evaluation.result.value;
  assert.equal(layout.innerWidth, 390);
  assert.ok(layout.documentScrollWidth <= layout.innerWidth, JSON.stringify(layout));
  assert.ok(layout.bodyScrollWidth <= layout.innerWidth, JSON.stringify(layout));
  assert.ok(layout.rect.left >= 0 && layout.rect.right <= layout.innerWidth + .5, JSON.stringify(layout));
  assert.ok(Math.abs(layout.centerX - (layout.rect.left + layout.rect.width / 2)) <= 2, JSON.stringify(layout));
  assert.ok(layout.acromionLeftX >= layout.rect.left && layout.acromionRightX <= layout.rect.right, JSON.stringify(layout));
  assert.ok(layout.toggleRight <= layout.innerWidth, JSON.stringify(layout));
  assert.equal(layout.overlayChecked, false, "measurement labels default off on phones");
  if (process.env.P0_CAPTURE_PATH) {
    const capture = await cdp.call("Page.captureScreenshot", { format: "png", fromSurface: true });
    await writeFile(process.env.P0_CAPTURE_PATH, Buffer.from(capture.data, "base64"));
  }
  if (process.env.P0_CAPTURE_DESKTOP_PATH) {
    await cdp.call("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
    await delay(150);
    const capture = await cdp.call("Page.captureScreenshot", { format: "png", fromSurface: true });
    await writeFile(process.env.P0_CAPTURE_DESKTOP_PATH, Buffer.from(capture.data, "base64"));
  }
});
