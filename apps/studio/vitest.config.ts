import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";
export default defineConfig({
  test: { include: ["test/**/*.test.ts"], environment: "node" },
  resolve: {
    alias: {
      "@open-avatar/core": fileURLToPath(
        new URL("../../packages/core/src/index.ts", import.meta.url),
      ),
      "@open-avatar/renderer-pixi": fileURLToPath(
        new URL("../../packages/renderer-pixi/src/index.ts", import.meta.url),
      ),
      "@open-avatar/schema": fileURLToPath(
        new URL("../../packages/schema/src/index.ts", import.meta.url),
      ),
    },
  },
});
