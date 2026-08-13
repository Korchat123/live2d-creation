export const parameterContract = Object.freeze({
  bustSize: Object.freeze({ min: 0, default: 1, max: 1.65, step: 0.05 }),
  bustSpacing: Object.freeze({ min: 0.9, default: 1, max: 1.12, step: 0.01 }),
  bustHeight: Object.freeze({ min: -0.03, default: 0, max: 0.03, step: 0.005 }),
  faceScale: Object.freeze({ min: 0.92, default: 1, max: 1.08, step: 0.01 }),
  headWidth: Object.freeze({ min: 0.92, default: 1, max: 1.08, step: 0.01 }),
  jawWidth: Object.freeze({ min: 0.88, default: 1, max: 1.12, step: 0.01 }),
  jawLength: Object.freeze({ min: 0.94, default: 1, max: 1.06, step: 0.01 })
});

export function defaultParameters() {
  return Object.fromEntries(
    Object.entries(parameterContract).map(([name, rule]) => [name, rule.default])
  );
}

export function setParameter(parameters, name, value) {
  const rule = parameterContract[name];
  if (!rule) throw new Error(`Unknown character parameter: ${name}`);
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) throw new Error(`Invalid value for ${name}`);
  return { ...parameters, [name]: Math.min(rule.max, Math.max(rule.min, numeric)) };
}
