import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const root = process.cwd();
const port = Number(process.env.PORT || 4173);
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json" };

createServer((request, response) => {
  const requested = new URL(request.url, `http://${request.headers.host}`).pathname;
  const relative = requested === "/" ? "index.html" : requested.slice(1);
  const path = normalize(join(root, relative));
  if (!path.startsWith(root) || !existsSync(path) || !statSync(path).isFile()) {
    response.writeHead(404).end("Not found");
    return;
  }
  response.writeHead(200, { "Content-Type": `${types[extname(path)] || "application/octet-stream"}; charset=utf-8` });
  createReadStream(path).pipe(response);
}).listen(port, () => console.log(`Geometry candidate: http://localhost:${port}`));
