import {
  SECURITY_LIMITS,
  type OpenAvatarManifest,
  validateManifest,
} from "@open-avatar/schema";

export const BUNDLE_LIMITS = {
  maxManifestBytes: SECURITY_LIMITS.maxManifestBytes,
  maxFiles: SECURITY_LIMITS.maxAssets,
  maxFileBytes: 16 * 1024 * 1024,
  maxTotalAssetBytes: 64 * 1024 * 1024,
} as const;

export type BundleDiagnosticCode =
  | "CANCELLED"
  | "MANIFEST_TOO_LARGE"
  | "INVALID_JSON"
  | "INVALID_MANIFEST"
  | "UNSUPPORTED_VERSION"
  | "INVALID_PATH"
  | "DUPLICATE_PATH"
  | "CASE_COLLISION"
  | "TOO_MANY_FILES"
  | "FILE_TOO_LARGE"
  | "BUNDLE_TOO_LARGE"
  | "UNDECLARED_FILE"
  | "MISSING_FILE"
  | "CHECKSUM_MISMATCH";

export interface BundleDiagnostic {
  code: BundleDiagnosticCode;
  message: string;
  assetId?: string;
}

export interface BundleFile {
  path: string;
  bytes: Uint8Array;
}

export interface BundleSource {
  manifestBytes: Uint8Array;
  files: ReadonlyArray<BundleFile>;
}

export type BundleValidationResult =
  | { ok: true; bundle: ValidatedBundle; diagnostics: readonly [] }
  | { ok: false; diagnostics: ReadonlyArray<BundleDiagnostic> };

const diagnostic = (
  code: BundleDiagnosticCode,
  message: string,
  assetId?: string,
): BundleDiagnostic => ({ code, message, ...(assetId ? { assetId } : {}) });

function isNormalizedRelativePath(path: string): boolean {
  if (
    path.length === 0 ||
    path.length > 512 ||
    path.includes("\\") ||
    path.startsWith("/") ||
    /^[A-Za-z]:/.test(path)
  )
    return false;
  const segments = path.split("/");
  return segments.every(
    (segment) =>
      segment.length > 0 &&
      segment !== "." &&
      segment !== ".." &&
      !segment.includes("\0"),
  );
}

async function sha256(bytes: Uint8Array): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

/**
 * An immutable, validated view of a bundle. Source buffers are copied so a
 * caller cannot mutate data after validation.
 */
export interface ValidatedBundle {
  readonly manifest: Readonly<OpenAvatarManifest>;
  readonly disposed: boolean;
  getFile(path: string): Uint8Array | undefined;
  dispose(): void;
}

class ValidatedBundleImpl implements ValidatedBundle {
  readonly manifest: Readonly<OpenAvatarManifest>;
  readonly #files: Map<string, Uint8Array>;
  #disposed = false;

  constructor(
    manifest: OpenAvatarManifest,
    files: ReadonlyMap<string, Uint8Array>,
  ) {
    this.manifest = deepFreeze(structuredClone(manifest));
    this.#files = new Map(
      Array.from(files, ([path, bytes]) => [path, bytes.slice()] as const),
    );
  }

  get disposed(): boolean {
    return this.#disposed;
  }

  getFile(path: string): Uint8Array | undefined {
    if (this.#disposed) throw new Error("Bundle has been disposed");
    const bytes = this.#files.get(path);
    return bytes?.slice();
  }

  dispose(): void {
    this.#disposed = true;
    this.#files.clear();
  }
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

/**
 * Validates an already-decoded collection of files. Archive extraction is
 * intentionally unsupported until a bounded streaming extractor is designed.
 */
export async function validateBundle(
  source: BundleSource,
  options: { signal?: AbortSignal } = {},
): Promise<BundleValidationResult> {
  const diagnostics: BundleDiagnostic[] = [];
  const cancelled = () => options.signal?.aborted === true;
  if (cancelled())
    return {
      ok: false,
      diagnostics: [diagnostic("CANCELLED", "Validation cancelled")],
    };

  if (source.manifestBytes.byteLength > BUNDLE_LIMITS.maxManifestBytes)
    return {
      ok: false,
      diagnostics: [
        diagnostic("MANIFEST_TOO_LARGE", "Manifest exceeds the byte limit"),
      ],
    };
  if (source.files.length > BUNDLE_LIMITS.maxFiles)
    return {
      ok: false,
      diagnostics: [
        diagnostic("TOO_MANY_FILES", "Bundle exceeds the file limit"),
      ],
    };

  let totalBytes = 0;
  const files = new Map<string, Uint8Array>();
  const casePaths = new Map<string, string>();
  for (const file of source.files) {
    if (cancelled())
      return {
        ok: false,
        diagnostics: [diagnostic("CANCELLED", "Validation cancelled")],
      };
    if (!isNormalizedRelativePath(file.path)) {
      diagnostics.push(
        diagnostic(
          "INVALID_PATH",
          "A file path is not normalized and relative",
        ),
      );
      continue;
    }
    if (files.has(file.path)) {
      diagnostics.push(
        diagnostic("DUPLICATE_PATH", "Bundle contains a duplicate file path"),
      );
      continue;
    }
    const folded = file.path.toLocaleLowerCase("en-US");
    if (casePaths.has(folded)) {
      diagnostics.push(
        diagnostic("CASE_COLLISION", "Bundle contains case-colliding paths"),
      );
      continue;
    }
    if (file.bytes.byteLength > BUNDLE_LIMITS.maxFileBytes)
      diagnostics.push(
        diagnostic("FILE_TOO_LARGE", "A file exceeds the byte limit"),
      );
    totalBytes += file.bytes.byteLength;
    casePaths.set(folded, file.path);
    files.set(file.path, file.bytes);
  }
  if (totalBytes > BUNDLE_LIMITS.maxTotalAssetBytes)
    diagnostics.push(
      diagnostic("BUNDLE_TOO_LARGE", "Bundle exceeds the total byte limit"),
    );
  if (diagnostics.length) return { ok: false, diagnostics };

  let input: unknown;
  try {
    input = JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(source.manifestBytes),
    );
  } catch {
    return {
      ok: false,
      diagnostics: [
        diagnostic("INVALID_JSON", "Manifest is not valid UTF-8 JSON"),
      ],
    };
  }
  if (
    typeof input === "object" &&
    input !== null &&
    "manifestVersion" in input &&
    typeof (input as { manifestVersion?: unknown }).manifestVersion ===
      "string" &&
    !/^1\.(?:0|[1-9][0-9]*)$/.test(
      (input as { manifestVersion: string }).manifestVersion,
    )
  )
    return {
      ok: false,
      diagnostics: [
        diagnostic("UNSUPPORTED_VERSION", "Manifest version is unsupported"),
      ],
    };
  const manifestResult = validateManifest(input);
  if (!manifestResult.valid || !manifestResult.value)
    return {
      ok: false,
      diagnostics: [
        diagnostic("INVALID_MANIFEST", "Manifest does not match the schema"),
      ],
    };

  const declared = new Set<string>();
  const declaredCase = new Set<string>();
  for (const asset of manifestResult.value.assets) {
    if (!isNormalizedRelativePath(asset.path)) {
      diagnostics.push(
        diagnostic(
          "INVALID_PATH",
          "An asset path is not normalized and relative",
          asset.id,
        ),
      );
      continue;
    }
    const folded = asset.path.toLocaleLowerCase("en-US");
    if (declared.has(asset.path))
      diagnostics.push(
        diagnostic(
          "DUPLICATE_PATH",
          "Manifest declares a duplicate path",
          asset.id,
        ),
      );
    else if (declaredCase.has(folded))
      diagnostics.push(
        diagnostic(
          "CASE_COLLISION",
          "Manifest declares case-colliding paths",
          asset.id,
        ),
      );
    declared.add(asset.path);
    declaredCase.add(folded);
    const bytes = files.get(asset.path);
    if (!bytes) {
      diagnostics.push(
        diagnostic("MISSING_FILE", "A declared asset is missing", asset.id),
      );
      continue;
    }
    if (asset.sha256 && (await sha256(bytes)) !== asset.sha256)
      diagnostics.push(
        diagnostic(
          "CHECKSUM_MISMATCH",
          "An asset checksum does not match",
          asset.id,
        ),
      );
  }
  for (const path of files.keys())
    if (!declared.has(path))
      diagnostics.push(
        diagnostic("UNDECLARED_FILE", "Bundle contains an undeclared file"),
      );
  if (cancelled())
    return {
      ok: false,
      diagnostics: [diagnostic("CANCELLED", "Validation cancelled")],
    };
  if (diagnostics.length) return { ok: false, diagnostics };
  return {
    ok: true,
    bundle: new ValidatedBundleImpl(manifestResult.value, files),
    diagnostics: [],
  };
}
