const round = value => Math.round(value * 1000) / 1000;

export const M = (x, y) => ({ type: "M", x, y });
export const L = (x, y) => ({ type: "L", x, y });
export const C = (x1, y1, x2, y2, x, y) => ({ type: "C", x1, y1, x2, y2, x, y });
export const Q = (x1, y1, x, y) => ({ type: "Q", x1, y1, x, y });
export const Z = () => ({ type: "Z" });

export function serializePath(commands) {
  return commands.map(command => {
    if (command.type === "Z") return "Z";
    return `${command.type} ${Object.entries(command).filter(([key]) => key !== "type").map(([, value]) => round(value)).join(" ")}`;
  }).join(" ");
}

const lerp = (a, b, t) => a + (b - a) * t;
const quadratic = (p0, p1, p2, t) => {
  const a = 1 - t;
  return { x: a * a * p0.x + 2 * a * t * p1.x + t * t * p2.x, y: a * a * p0.y + 2 * a * t * p1.y + t * t * p2.y };
};
const cubic = (p0, p1, p2, p3, t) => {
  const a = 1 - t;
  return { x: a ** 3 * p0.x + 3 * a * a * t * p1.x + 3 * a * t * t * p2.x + t ** 3 * p3.x, y: a ** 3 * p0.y + 3 * a * a * t * p1.y + 3 * a * t * t * p2.y + t ** 3 * p3.y };
};

export function samplePath(commands, steps = 24) {
  const samples = [];
  let current = null;
  let start = null;
  const append = point => samples.push({ x: round(point.x), y: round(point.y) });
  for (const command of commands) {
    if (command.type === "M") { current = { x: command.x, y: command.y }; start = current; append(current); continue; }
    if (command.type === "Z") {
      if (current && start) for (let index = 1; index <= steps; index += 1) append({ x: lerp(current.x, start.x, index / steps), y: lerp(current.y, start.y, index / steps) });
      current = start;
      continue;
    }
    const end = { x: command.x, y: command.y };
    for (let index = 1; index <= steps; index += 1) {
      const t = index / steps;
      if (command.type === "L") append({ x: lerp(current.x, end.x, t), y: lerp(current.y, end.y, t) });
      if (command.type === "Q") append(quadratic(current, { x: command.x1, y: command.y1 }, end, t));
      if (command.type === "C") append(cubic(current, { x: command.x1, y: command.y1 }, { x: command.x2, y: command.y2 }, end, t));
    }
    current = end;
  }
  return Object.freeze(samples);
}

export function pathBounds(commands) {
  const samples = samplePath(commands, 64);
  const xs = samples.map(point => point.x); const ys = samples.map(point => point.y);
  const minX = Math.min(...xs); const maxX = Math.max(...xs); const minY = Math.min(...ys); const maxY = Math.max(...ys);
  return Object.freeze({ minX, maxX, minY, maxY, width: round(maxX - minX), height: round(maxY - minY) });
}

export function intersectionsAtY(commands, y, tolerance = .75) {
  const samples = samplePath(commands, 96);
  const hits = [];
  for (let index = 1; index < samples.length; index += 1) {
    const a = samples[index - 1]; const b = samples[index];
    if ((a.y - y) * (b.y - y) > 0 || Math.abs(a.y - b.y) < .0001) continue;
    const t = (y - a.y) / (b.y - a.y);
    if (t < 0 || t > 1) continue;
    const x = round(lerp(a.x, b.x, t));
    if (!hits.some(value => Math.abs(value - x) <= tolerance)) hits.push(x);
  }
  return Object.freeze(hits.sort((a, b) => a - b));
}
