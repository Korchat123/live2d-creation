import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    proxy: {
      "/comfy": {
        target: "http://127.0.0.1:8188",
        changeOrigin: true,
        headers: { origin: "http://127.0.0.1:8188" },
        rewrite: (path) => path.replace(/^\/comfy/, ""),
      },
    },
  },
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
