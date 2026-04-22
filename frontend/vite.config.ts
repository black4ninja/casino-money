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
    server: {
      port: Number(env.VITE_PORT ?? 8484),
      strictPort: true,
    },
    preview: {
      port: Number(env.VITE_PORT ?? 8484),
    },
  };
});
