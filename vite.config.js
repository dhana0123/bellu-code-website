import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(fileURLToPath(new URL(".", import.meta.url)), "index.html"),
        changelog: resolve(fileURLToPath(new URL(".", import.meta.url)), "changelog.html"),
        securityIntelligenceGraph: resolve(fileURLToPath(new URL(".", import.meta.url)), "security-intelligence-graph.html"),
      },
    },
  },
});
