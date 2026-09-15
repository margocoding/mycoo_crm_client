import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: "0.0.0.0", port: 3000, strictPort: true,
      hmr: { port: Number(env.DEV_HMR_PORT || 3000) },
      proxy: { "/api": { target: env.API_PROXY_TARGET || "http://127.0.0.1:3001", changeOrigin: true } },
    },
    resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  };
});
