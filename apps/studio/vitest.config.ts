import { resolve } from "node:path";
import { defineConfig } from "vitest/config";
export default defineConfig({
  test: { include: ["test/**/*.test.ts"], environment: "node" },
  resolve: {
    alias: {
      "@open-avatar/core": resolve(
        import.meta.dirname,
        "../../packages/core/src/index.ts",
      ),
      "@open-avatar/renderer-pixi": resolve(
        import.meta.dirname,
        "../../packages/renderer-pixi/src/index.ts",
      ),
      "@open-avatar/schema": resolve(
        import.meta.dirname,
        "../../packages/schema/src/index.ts",
      ),
    },
  },
});
