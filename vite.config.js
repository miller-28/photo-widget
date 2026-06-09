import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/target/**"],
    },
  },
  optimizeDeps: {
    exclude: [
      "@tauri-apps/api/core",
      "@tauri-apps/api/path",
      "@tauri-apps/api/window",
      "@tauri-apps/plugin-fs",
    ],
  },
});
