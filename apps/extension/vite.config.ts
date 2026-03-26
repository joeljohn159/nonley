import { resolve } from "path";

import preact from "@preact/preset-vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [preact()],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "src/popup/index.html"),
        content: resolve(__dirname, "src/content/index.ts"),
        background: resolve(__dirname, "src/background/index.ts"),
      },
      output: {
        entryFileNames: "[name].js",
        // No code splitting - MV3 content scripts must be self-contained
        inlineDynamicImports: false,
        manualChunks: undefined,
      },
    },
    outDir: "dist",
    emptyOutDir: true,
  },
});
