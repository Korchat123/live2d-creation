/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_COMFY_CHECKPOINTS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
