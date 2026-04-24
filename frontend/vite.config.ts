import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, repoRoot, "");
  return {
    base: env.VITE_BASE ?? "/",
    envDir: repoRoot,
    plugins: [
      react(),
      tailwindcss(),
      // Parse JS SDK lazy-requires node built-ins (events, crypto, stream, vm…).
      // Polyfill all of them so every code path in the browser build resolves.
      nodePolyfills({
        globals: { Buffer: true, process: true },
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    build: {
      // Route-level code splitting lives in App.tsx (React.lazy). Here we
      // carve out the heaviest vendor buckets so they ship as their own
      // chunks — that way the browser can parallelize downloads and, more
      // importantly, cache them across deploys where our app code churns
      // but the vendor code usually doesn't.
      //
      // `chunkSizeWarningLimit` is bumped to 1000 kB because the Parse SDK
      // chunk sits right under 1 MB — expected given how much the SDK
      // bundles. The warning is advisory only; it doesn't affect runtime.
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            "vendor-react": ["react", "react-dom", "react-router-dom"],
            "vendor-parse": ["parse"],
            "vendor-crypto": [
              "@noble/ed25519",
              "@noble/hashes",
              "@noble/hashes/sha256",
              "pako",
              "qrcode",
            ],
            "vendor-scanner": ["@zxing/browser", "@zxing/library"],
            "vendor-table": ["@tanstack/react-table"],
          },
        },
      },
    },
    server: {
      port: Number(env.VITE_PORT ?? 8484),
      strictPort: true,
    },
    preview: {
      port: Number(env.VITE_PORT ?? 8484),
    },
  };
});
