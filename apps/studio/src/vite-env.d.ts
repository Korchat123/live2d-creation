/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_COMFY_CHECKPOINTS?: string;
  readonly VITE_COMFY_CONTROLNETS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
