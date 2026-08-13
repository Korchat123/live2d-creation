import { mkdir, writeFile } from "node:fs/promises";

const port = process.argv[2] ?? "9222";
const screenshotDirectory = process.argv[3];
const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
const page = targets.find((target) => target.type === "page");
if (!page) throw new Error("No browser page target found");

const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let sequence = 0;
const pending = new Map();
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.method === "Runtime.exceptionThrown") {
    console.error("BROWSER_EXCEPTION", message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text);
  }
  if (!message.id || !pending.has(message.id)) return;
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  message.error ? reject(new Error(message.error.message)) : resolve(message.result);
});

function command(method, params = {}) {
  const id = ++sequence;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

async function evaluate(expression) {
  const result = await command("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  return result.result.value;
}

await command("Runtime.enable");
await command("Network.enable");
await command("Network.setCacheDisabled", { cacheDisabled: true });
await command("Page.enable");
await command("Page.reload", { ignoreCache: true });
await new Promise((resolve) => setTimeout(resolve, 500));
if (screenshotDirectory) await mkdir(screenshotDirectory, { recursive: true });
for (const category of ["eyes", "mouth", "hair", "bust", "base", "outfit", "anatomy", "preview"]) {
  const point = await evaluate(`(() => { const r=document.querySelector('[data-category="${category}"]').getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}; })()`);
  await command("Input.dispatchMouseEvent", { type: "mousePressed", x: point.x, y: point.y, button: "left", clickCount: 1 });
  await command("Input.dispatchMouseEvent", { type: "mouseReleased", x: point.x, y: point.y, button: "left", clickCount: 1 });
  const state = await evaluate(`(async () => { await Promise.all([...document.querySelectorAll('#character img')].map(image => image.decode?.().catch(() => {}) ?? Promise.resolve())); await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); const r=document.querySelector('#character').getBoundingClientRect(), s=document.querySelector('.stage').getBoundingClientRect(); return {category:document.querySelector('.category-button.is-active')?.dataset.category,title:document.querySelector('#inspector-title')?.textContent,controls:document.querySelector('#context-controls')?.textContent.replace(/\\s+/g,' ').trim(),preview:document.querySelector('#character')?.className,rect:{x:r.x,y:r.y,width:r.width,height:r.height},stage:{x:s.x,y:s.y,width:s.width,height:s.height}}; })()`);
  console.log(JSON.stringify(state));
  if (screenshotDirectory && ["eyes", "mouth", "hair", "bust", "preview"].includes(category)) {
    const screenshot = await command("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    await writeFile(`${screenshotDirectory}/${category}.png`, Buffer.from(screenshot.data, "base64"));
  }
}
socket.close();
