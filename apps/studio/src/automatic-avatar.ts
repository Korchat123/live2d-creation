import {
  expressionLayers,
  isProjectReady,
  type ExportedProject,
} from "./authoring.js";

const MAX_PROJECT_BYTES = 64 * 1024 * 1024;
const MAX_IMAGE_LENGTH = 8 * 1024 * 1024;
const MAX_LAYER_COUNT = 48;
const safeLayerName = /^[a-z][a-z0-9 ]{0,63}$/u;
const DATABASE_NAME = "open-avatar-generated";
const STORE_NAME = "projects";
const ACTIVE_KEY = "active";

export const hasCompleteGeneratedArtwork = (
  layers: Readonly<Record<string, string>>,
  generatedArtwork: Readonly<Record<string, string>>,
): boolean => {
  const names = Object.keys(layers);
  return (
    names.length > 0 && names.every((name) => Boolean(generatedArtwork[name]))
  );
};

const embeddedImage = (value: unknown, label: string): string => {
  if (
    typeof value !== "string" ||
    value.length < 1 ||
    value.length > MAX_IMAGE_LENGTH ||
    (!value.startsWith("data:image/png;base64,") &&
      !value.startsWith("data:image/webp;base64,") &&
      !value.startsWith("data:image/jpeg;base64,"))
  )
    throw new Error(`Invalid ${label}.`);
  return value;
};

const imageRecord = (
  value: unknown,
  label: string,
): Readonly<Record<string, string>> => {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error(`Invalid ${label}.`);
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length > MAX_LAYER_COUNT)
    throw new Error(`${label} contains too many images.`);
  return Object.fromEntries(
    entries.map(([name, image]) => {
      if (!safeLayerName.test(name)) throw new Error(`Invalid ${label} name.`);
      return [name, embeddedImage(image, `${label} image`)] as const;
    }),
  );
};

const boundedStrings = (value: unknown, label: string): readonly string[] => {
  if (
    !Array.isArray(value) ||
    value.length > 64 ||
    value.some((item) => typeof item !== "string" || item.length > 1000)
  )
    throw new Error(`Invalid ${label}.`);
  return value as string[];
};

export const parseAutomaticAvatarProject = (
  contents: string,
): ExportedProject => {
  if (new TextEncoder().encode(contents).byteLength > MAX_PROJECT_BYTES)
    throw new Error("The Open Avatar project exceeds 64 MiB.");
  const value = JSON.parse(contents) as Partial<ExportedProject>;
  const updatedAt = value.updatedAt;
  if (
    value.version !== 1 ||
    typeof updatedAt !== "number" ||
    !Number.isSafeInteger(updatedAt) ||
    updatedAt < 0
  )
    throw new Error("Unsupported or invalid Open Avatar project.");
  const layers = imageRecord(value.layers, "layer set");
  if (!isProjectReady(layers))
    throw new Error(
      "The Open Avatar project is missing required motion parts.",
    );
  const generatedArtwork = imageRecord(
    value.generatedArtwork,
    "generated artwork",
  );
  const expressionArtwork = imageRecord(
    value.expressionArtwork,
    "expression artwork",
  );
  if (
    Object.keys(expressionArtwork).some((name) => !(name in expressionLayers))
  )
    throw new Error("The project contains an unknown expression state.");
  return {
    version: 1,
    updatedAt,
    source: embeddedImage(value.source, "project source image"),
    layers,
    generatedArtwork,
    expressionArtwork,
    missingArtwork: boundedStrings(value.missingArtwork, "missing-art list"),
    limitations: boundedStrings(value.limitations, "limitations"),
  };
};

export const serializeAutomaticAvatarProject = (
  project: ExportedProject,
): string => JSON.stringify(project);

const openDatabase = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onerror = () => reject(new Error("Could not open avatar storage."));
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME))
        request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
  });

export const saveAutomaticAvatarProject = async (
  project: ExportedProject,
): Promise<void> => {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.onerror = () =>
        reject(new Error("Could not save the generated avatar project."));
      transaction.oncomplete = () => resolve();
      transaction
        .objectStore(STORE_NAME)
        .put(serializeAutomaticAvatarProject(project), ACTIVE_KEY);
    });
  } finally {
    database.close();
  }
};

export const loadAutomaticAvatarProject = async (): Promise<
  ExportedProject | undefined
> => {
  const database = await openDatabase();
  try {
    const contents = await new Promise<unknown>((resolve, reject) => {
      const request = database
        .transaction(STORE_NAME, "readonly")
        .objectStore(STORE_NAME)
        .get(ACTIVE_KEY);
      request.onerror = () =>
        reject(new Error("Could not restore the generated avatar project."));
      request.onsuccess = () => resolve(request.result);
    });
    if (contents === undefined) return undefined;
    if (typeof contents !== "string")
      throw new Error("Stored generated avatar project is invalid.");
    return parseAutomaticAvatarProject(contents);
  } finally {
    database.close();
  }
};
