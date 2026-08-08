import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@shared": resolve(rootDir, "../shared"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/jobs": "http://localhost:3001",
      "/ws": { target: "ws://localhost:3001", ws: true },
      "/health": "http://localhost:3001",
    },
  },
});
