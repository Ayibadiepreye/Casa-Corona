import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// Custom plugin: serve a self-unregistering service worker for /sw.js so
// any already-registered SW in the user's browser cleans itself up.
function swUnregisterPlugin(): Plugin {
  return {
    name: "sw-unregister-handler",
    configureServer(server) {
      server.middlewares.use("/sw.js", (_req, res) => {
        res.setHeader("Content-Type", "application/javascript");
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
        res.end(
          "// Self-unregistering service worker stub.\n" +
          "// The previous /sw.js caused 'frame is sandboxed' errors so we\n" +
          "// replace it with one that unregisters itself + clears caches.\n" +
          "self.addEventListener('install', () => self.skipWaiting());\n" +
          "self.addEventListener('activate', (e) => {\n" +
          "  e.waitUntil(self.registration.unregister());\n" +
          "  if (typeof caches !== 'undefined' && caches.keys) {\n" +
          "    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));\n" +
          "  }\n" +
          "});\n"
        );
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use("/sw.js", (_req, res) => {
        res.setHeader("Content-Type", "application/javascript");
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
        res.end(
          "self.addEventListener('install', () => self.skipWaiting());\n" +
          "self.addEventListener('activate', (e) => {\n" +
          "  e.waitUntil(self.registration.unregister());\n" +
          "});\n"
        );
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), swUnregisterPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
    dedupe: ["react", "react-dom"],
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  preview: {
    port: 5173,
  },
});