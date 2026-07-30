import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    sourcemap: true,
    rollupOptions: {
      input: {
        builder: fileURLToPath(new URL("./index.html", import.meta.url)),
        motion: fileURLToPath(new URL("./motion.html", import.meta.url)),
      },
    },
  },
});
