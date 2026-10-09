import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 5173,
    // Fail instead of silently switching ports: web-client embeds this exact URL.
    strictPort: true,
  },
  preview: {
    port: 5173,
    strictPort: true,
  },
  build: {
    // Phaser alone is ~1 MB minified; raise the warning threshold accordingly.
    chunkSizeWarningLimit: 2000,
  },
});
