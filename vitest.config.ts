import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: [
        "packages/schema/src/**/*.ts",
        "packages/core/src/**/*.ts",
        "packages/controls/src/**/*.ts",
        "packages/runtime/src/**/*.ts",
        "packages/validator/src/**/*.ts",
      ],
      thresholds: {
        branches: 80,
        functions: 85,
        lines: 85,
        statements: 85,
      },
    },
    passWithNoTests: true,
    projects: ["packages/*/vitest.config.ts", "apps/*/vitest.config.ts"],
  },
});
