/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

// Pyodide is self-hosted (copied into /pyodide/) so school networks only ever
// need to reach our own domain — no CDN dependency in the classroom.
export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: "node_modules/pyodide/*",
          dest: "pyodide",
        },
      ],
    }),
  ],
  optimizeDeps: {
    exclude: ["pyodide"],
  },
  worker: {
    format: "es",
  },
  test: {
    // Playwright specs live in e2e/ and are not Vitest's to run.
    exclude: ["e2e/**", "node_modules/**", "dist/**"],
  },
});
