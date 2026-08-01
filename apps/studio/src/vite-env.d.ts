/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_COMFY_CHECKPOINTS?: string;
  readonly VITE_COMFY_CONTROLNETS?: string;
  readonly VITE_COMFY_ENABLE_COMPOSITION_CONTROL?: string;
  readonly VITE_COMFY_Z_IMAGE_DIFFUSION_MODEL?: string;
  readonly VITE_COMFY_Z_IMAGE_TEXT_ENCODER?: string;
  readonly VITE_COMFY_Z_IMAGE_VAE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
